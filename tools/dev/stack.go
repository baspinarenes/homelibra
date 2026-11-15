package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/lipgloss"
)

var (
	stepStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("4"))
	failStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("1"))
	noteStyle = lipgloss.NewStyle().Faint(true)
)

func step(s string) { fmt.Println("\n" + stepStyle.Render("→ "+s)) }
func note(s string) { fmt.Println(noteStyle.Render("  " + s)) }
func fail(s string) {
	fmt.Fprintln(os.Stderr, "\n"+failStyle.Render("✗ "+s))
	os.Exit(1)
}

// detach starts cmd in its own process group with no output, so it outlives
// `pnpm dev` (an emulator keeps running after Ctrl-C).
func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Stdout, cmd.Stderr, cmd.Stdin = nil, nil, nil
}

// Stack is the local environment: what it started, so Stop can end it.
type Stack struct {
	Root        string
	Interactive bool
	E2E         bool // the API accepts the fixed e2e sign-in code

	mu       sync.Mutex
	children []*exec.Cmd // each in its own process group, killed as a group
}

// Up brings up Postgres, migrations and the API, then Metro and the app on the
// chosen platform, and returns when Metro (or, for api, the API) exits.
func (s *Stack) Up(p Platform, d Device, rebuild bool) error {
	ports := []int{apiPort}
	if p != APIOnly {
		ports = append(ports, metroPort)
	}
	if err := s.freePorts(ports); err != nil {
		return err
	}

	serial := ""
	switch p {
	case Android:
		var err error
		if serial, err = s.android(d, rebuild); err != nil {
			return err
		}
	case IOS:
		if err := s.ios(d, rebuild); err != nil {
			return err
		}
	}

	if err := s.postgres(); err != nil {
		return err
	}
	if err := s.migrate(); err != nil {
		return err
	}
	apiExit, err := s.api()
	if err != nil {
		return err
	}
	if p == APIOnly {
		note("Ctrl-C stops the API; Postgres keeps running.")
		return ignoreInterrupt(<-apiExit)
	}
	return s.metro(p, d, serial)
}

// --- ports ---

// pidOn is the process listening on a TCP port, or 0.
func pidOn(port int) int {
	out, _ := exec.Command("lsof", "-nP", "-tiTCP:"+strconv.Itoa(port), "-sTCP:LISTEN").Output()
	pid, _ := strconv.Atoi(strings.TrimSpace(strings.SplitN(string(out), "\n", 2)[0]))
	return pid
}

func commandOf(pid int) string {
	out, _ := exec.Command("ps", "-o", "command=", "-p", strconv.Itoa(pid)).Output()
	c := strings.TrimSpace(string(out))
	if len(c) > 80 {
		c = c[:80] + "…"
	}
	return c
}

// freePorts never moves a server to another port: a leftover API or Metro from
// another terminal is the usual reason the app talks to the wrong server.
func (s *Stack) freePorts(ports []int) error {
	for _, port := range ports {
		pid := pidOn(port)
		if pid == 0 {
			continue
		}
		what := fmt.Sprintf("Port %d is taken by PID %d (%s)", port, pid, commandOf(pid))
		if !s.Interactive {
			return fmt.Errorf("%s. Stop it first: kill %d", what, pid)
		}
		kill := false
		if err := huh.NewConfirm().Title(what + ". Durdurayım mı?").Affirmative("Evet").Negative("Hayır").Value(&kill).Run(); err != nil {
			return err
		}
		if !kill {
			return fmt.Errorf("%s; nothing started", what)
		}
		_ = syscall.Kill(pid, syscall.SIGTERM)
		for i := 0; i < 20 && pidOn(port) != 0; i++ {
			time.Sleep(250 * time.Millisecond)
		}
		if pidOn(port) != 0 {
			return fmt.Errorf("PID %d is still on port %d: kill -9 %d", pid, port, pid)
		}
	}
	return nil
}

// --- devices ---

func (s *Stack) android(d Device, rebuild bool) (string, error) {
	if _, err := os.Stat(adbPath()); err != nil {
		return "", errors.New("adb not found: install Android Studio, or add ~/Library/Android/sdk/platform-tools to PATH")
	}
	serial, err := BootAndroid(d)
	if err != nil {
		return "", err
	}
	step("Cihaz: " + d.Name)
	adb := func(args ...string) *exec.Cmd {
		return exec.Command(adbPath(), append([]string{"-s", serial}, args...)...)
	}
	for _, port := range []int{apiPort, metroPort} {
		tcp := "tcp:" + strconv.Itoa(port)
		if out, err := adb("reverse", tcp, tcp).CombinedOutput(); err != nil {
			return "", fmt.Errorf("adb reverse %s: %s", tcp, out)
		}
	}
	note(fmt.Sprintf("%s, localhost:%d and :%d reversed", serial, apiPort, metroPort))

	out, _ := adb("shell", "pm", "list", "packages", appPackage).Output()
	installed := strings.Contains(string(out)+"\n", "package:"+appPackage+"\n")
	if rebuild || !installed {
		step("Dev build (the first time takes a few minutes)")
		cmd := s.pnpm("--filter", "@homelibra/app", "exec", "expo", "run:android", "--no-bundler")
		cmd.Env = append(os.Environ(), "ANDROID_SERIAL="+serial)
		if err := s.inherit(cmd).Run(); err != nil {
			return "", fmt.Errorf("the dev build failed: %w", err)
		}
	}
	return serial, nil
}

func (s *Stack) ios(d Device, rebuild bool) error {
	if _, err := exec.LookPath("xcrun"); err != nil {
		return errors.New("xcrun not found: install Xcode, then run xcode-select -s /Applications/Xcode.app")
	}
	if err := BootIOS(d); err != nil {
		return fmt.Errorf("%s did not boot: %w", d.Name, err)
	}
	step("Simülatör: " + d.Name)
	installed := exec.Command("xcrun", "simctl", "get_app_container", d.ID, appPackage).Run() == nil
	if rebuild || !installed {
		step("Dev build (the first time takes several minutes)")
		cmd := s.pnpm("--filter", "@homelibra/app", "exec", "expo", "run:ios", "--no-bundler", "--device", d.ID)
		if err := s.inherit(cmd).Run(); err != nil {
			return fmt.Errorf("the dev build failed: %w", err)
		}
	}
	return nil
}

// --- Postgres and the API ---

func (s *Stack) postgres() error {
	step("Postgres")
	if exec.Command("docker", "info").Run() != nil {
		return errors.New("Docker is not running: start Docker Desktop and retry")
	}
	if out, err := s.cmd("docker", "compose", "up", "-d", "--build", "postgres").CombinedOutput(); err != nil {
		return fmt.Errorf("docker compose up postgres:\n%s", lastLines(string(out), 4))
	}
	for i := 0; ; i++ {
		if s.cmd("docker", "compose", "exec", "-T", "postgres", "pg_isready", "-U", "postgres", "-q").Run() == nil {
			break
		}
		if i == 60 {
			return errors.New("Postgres did not become ready in a minute: docker compose logs postgres")
		}
		time.Sleep(time.Second)
	}
	note("ready on :5432")
	return nil
}

func (s *Stack) migrate() error {
	step("Migrations")
	env := filepath.Join(s.Root, "apps", "api", ".env")
	if _, err := os.Stat(env); errors.Is(err, os.ErrNotExist) {
		example, err := os.ReadFile(env + ".example")
		if err != nil {
			return err
		}
		if err := os.WriteFile(env, example, 0o600); err != nil {
			return err
		}
		note("created apps/api/.env from .env.example")
	}
	if out, err := s.pnpm("--filter", "@homelibra/api", "db:migrate").CombinedOutput(); err != nil {
		return fmt.Errorf("migrations failed:\n%s", out)
	}
	note("applied")
	return nil
}

// api starts the API and returns once it answers; the channel gets its exit.
func (s *Stack) api() (<-chan error, error) {
	step(fmt.Sprintf("API on :%d (sign-in codes appear here as [api] lines)", apiPort))
	cmd := s.pnpm("--filter", "@homelibra/api", "dev")
	cmd.Env = os.Environ()
	if s.E2E && os.Getenv("E2E_SIGN_IN_CODE") == "" {
		// `pnpm e2e` signs e2e@homelibra.test in with it (scripts/e2e.sh); the API
		// ignores it beside a real mailer and refuses it in production.
		cmd.Env = append(cmd.Env, "E2E_SIGN_IN_CODE="+e2eCode)
	}
	if apiPort != 3000 || metroPort != 8081 {
		api := fmt.Sprintf("http://localhost:%d", apiPort)
		cmd.Env = append(cmd.Env, "PORT="+strconv.Itoa(apiPort), "BETTER_AUTH_URL="+api,
			fmt.Sprintf("CORS_ORIGINS=http://localhost:%d", metroPort))
	}
	out, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	cmd.Stderr = cmd.Stdout
	if err := s.start(cmd); err != nil {
		return nil, err
	}
	exited := make(chan error, 1)
	go func() {
		// Read to the end before Wait, which closes the pipe: a crash's last lines matter.
		prefix(out, "[api] ")
		exited <- cmd.Wait()
	}()
	ok := fmt.Sprintf("http://localhost:%d/api/auth/ok", apiPort)
	for {
		select {
		case <-exited:
			return nil, errors.New("the API exited; see the [api] lines above")
		case <-time.After(time.Second):
		}
		if res, err := http.Get(ok); err == nil {
			res.Body.Close()
			if res.StatusCode == http.StatusOK {
				return exited, nil
			}
		}
	}
}

func prefix(r io.Reader, p string) {
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		fmt.Println(p + sc.Text())
	}
}

// --- Metro and the app ---

// metro runs Metro in the foreground (its keys, r to reload, work), and once it
// answers opens the dev build on the device, or the browser for web.
func (s *Stack) metro(p Platform, d Device, serial string) error {
	args := []string{"--filter", "@homelibra/app", "exec", "expo", "start", "--port", strconv.Itoa(metroPort)}
	if p == Web {
		step(fmt.Sprintf("Metro on :%d, opening the browser", metroPort))
		args = append(args, "--web")
	} else {
		step(fmt.Sprintf("Metro on :%d, opening the app on %s", metroPort, d.Name))
		args = append(args, "--dev-client")
	}
	cmd := s.pnpm(args...)
	if apiPort != 3000 {
		cmd.Env = append(os.Environ(), fmt.Sprintf("EXPO_PUBLIC_API_URL=http://localhost:%d", apiPort))
	}
	s.inherit(cmd)
	// Metro stays in this process group: it reads the terminal, and Ctrl-C reaches it directly.
	if err := cmd.Start(); err != nil {
		return err
	}
	if p != Web {
		go func() {
			if waitFor(fmt.Sprintf("http://localhost:%d/status", metroPort), 2*time.Minute) {
				open(p, d, serial)
			}
		}()
	}
	return ignoreInterrupt(cmd.Wait())
}

// devClientURL opens the dev build straight onto this Metro, without its launcher screen.
func devClientURL() string {
	return appScheme + "://expo-development-client/?url=" + url.QueryEscape(fmt.Sprintf("http://localhost:%d", metroPort))
}

func open(p Platform, d Device, serial string) {
	var cmd *exec.Cmd
	if p == Android {
		cmd = exec.Command(adbPath(), "-s", serial, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "'"+devClientURL()+"'", appPackage)
	} else {
		cmd = exec.Command("xcrun", "simctl", "openurl", d.ID, devClientURL())
	}
	if out, err := cmd.CombinedOutput(); err != nil {
		note("could not open the app (" + strings.TrimSpace(string(out)) + "); open it on the device")
	}
}

func waitFor(u string, limit time.Duration) bool {
	deadline := time.Now().Add(limit)
	for time.Now().Before(deadline) {
		if res, err := http.Get(u); err == nil {
			res.Body.Close()
			if res.StatusCode == http.StatusOK {
				return true
			}
		}
		time.Sleep(time.Second)
	}
	return false
}

// --- processes ---

func (s *Stack) cmd(name string, args ...string) *exec.Cmd {
	c := exec.Command(name, args...)
	c.Dir = s.Root
	return c
}

func (s *Stack) pnpm(args ...string) *exec.Cmd { return s.cmd("pnpm", args...) }

func (s *Stack) inherit(c *exec.Cmd) *exec.Cmd {
	c.Stdin, c.Stdout, c.Stderr = os.Stdin, os.Stdout, os.Stderr
	return c
}

// start runs c in its own process group, so Stop ends it with every process it spawned.
func (s *Stack) start(c *exec.Cmd) error {
	c.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if err := c.Start(); err != nil {
		return err
	}
	s.mu.Lock()
	s.children = append(s.children, c)
	s.mu.Unlock()
	return nil
}

// Stop ends the API (and anything else started in the background); Postgres keeps running.
func (s *Stack) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, c := range s.children {
		if c.Process != nil {
			_ = syscall.Kill(-c.Process.Pid, syscall.SIGTERM)
		}
	}
	s.children = nil
}

// TrapSignals keeps Ctrl-C from killing this process before Stop runs: Metro
// gets the signal itself and exits, and Up returns.
func (s *Stack) TrapSignals() {
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM, syscall.SIGHUP)
	go func() {
		<-sig
		s.Stop()
	}()
}

// ignoreInterrupt treats a child stopped by Ctrl-C as a normal end.
func ignoreInterrupt(err error) error {
	var exit *exec.ExitError
	if errors.As(err, &exit) {
		if status, ok := exit.Sys().(syscall.WaitStatus); ok && status.Signaled() {
			return nil
		}
		if exit.ExitCode() == 130 || exit.ExitCode() == 143 {
			return nil
		}
	}
	return err
}

func lastLines(s string, n int) string {
	lines := strings.Split(strings.TrimRight(s, "\n"), "\n")
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	for i, l := range lines {
		lines[i] = strings.TrimSpace(l)
	}
	return strings.Join(lines, "\n")
}
