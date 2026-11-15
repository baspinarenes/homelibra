// Command dev is `pnpm dev`: it asks what to run (Android, iOS, web or the API
// alone) and on which device, then brings up the whole local stack for it:
// Postgres, migrations, the API on :3000, Metro on :8081 and the app.
//
// With flags it asks nothing (`pnpm dev --platform android --device Pixel_8`),
// and without a terminal it never asks: Claude sessions and launch.json use it so.
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/charmbracelet/huh"
	"golang.org/x/term"
)

// The dev build's Android package / iOS bundle ID and URL scheme (apps/app/app.json).
const (
	appPackage = "app.homelibra"
	appScheme  = "homelibra"
	e2eCode    = "246810" // the fixed sign-in code for e2e@homelibra.test; scripts/e2e.sh too
)

// The ports the app expects. Only an explicit flag moves them (a second checkout
// beside a running stack); a taken port is never swapped for a free one silently.
var apiPort, metroPort = 3000, 8081

type Platform string

const (
	Android Platform = "android"
	IOS     Platform = "ios"
	Web     Platform = "web"
	APIOnly Platform = "api"
)

type Choice struct {
	Platform Platform `json:"platform"`
	Device   string   `json:"device"` // a Device ID or name; empty for web and api
	DB       string   `json:"db"`     // local; prod is not available yet
}

func main() {
	if err := run(); err != nil {
		fail(err.Error())
	}
}

func run() error {
	root, err := repoRoot()
	if err != nil {
		return err
	}
	platform := flag.String("platform", "", "android, ios, web or api")
	device := flag.String("device", "", "an AVD name, adb serial, simulator name or UDID")
	db := flag.String("db", "", "local")
	flag.IntVar(&apiPort, "api-port", apiPort, "the API's port")
	flag.IntVar(&metroPort, "metro-port", metroPort, "Metro's port")
	rebuild := flag.Bool("rebuild", false, "reinstall the dev build (after a native dependency changes)")
	flag.Parse()

	interactive := term.IsTerminal(int(os.Stdin.Fd())) && term.IsTerminal(int(os.Stdout.Fd()))
	last := loadLast(root)
	choice := Choice{Platform: Platform(*platform), Device: *device, DB: *db}

	if choice.Platform == "" {
		if !interactive {
			return errors.New("no terminal to ask in: pass --platform android|ios|web|api (and --device for android/ios)")
		}
		if err := askPlatform(&choice, last); err != nil {
			return err
		}
	}
	if choice.DB == "" {
		choice.DB = "local"
	}
	if choice.DB != "local" {
		return errors.New("--db " + choice.DB + ": only local is available; reading production is not set up")
	}

	var target Device
	switch choice.Platform {
	case Android, IOS:
		devices := AndroidDevices()
		if choice.Platform == IOS {
			devices = IOSDevices()
		}
		if len(devices) == 0 {
			return noDevices(choice.Platform)
		}
		if choice.Device == "" && interactive {
			if err := askDevice(&choice, devices, last); err != nil {
				return err
			}
		}
		target = pick(devices, choice.Device)
		choice.Device = target.ID
		if target.Kind == Emulator && !target.Running {
			choice.Device = target.Name // the AVD name: its serial changes every boot
		}
	case Web, APIOnly:
	default:
		return fmt.Errorf("--platform %q: use android, ios, web or api", choice.Platform)
	}
	saveLast(root, choice)

	s := &Stack{Root: root, Interactive: interactive}
	defer s.Stop()
	s.TrapSignals()
	return s.Up(choice.Platform, target, *rebuild)
}

func askPlatform(c *Choice, last Choice) error {
	p := last.Platform
	if p == "" {
		p = Android
	}
	if err := huh.NewSelect[Platform]().
		Title("Ne çalışsın?").
		Options(
			huh.NewOption("Android (emülatör ya da USB telefon)", Android),
			huh.NewOption("iOS simülatörü", IOS),
			huh.NewOption("Web (tarayıcı)", Web),
			huh.NewOption("Yalnızca API (Postgres + API, Metro yok)", APIOnly),
		).
		Value(&p).
		Run(); err != nil {
		return err
	}
	c.Platform = p
	return nil
}

func askDevice(c *Choice, devices []Device, last Choice) error {
	options := make([]huh.Option[string], len(devices))
	for i, d := range devices {
		options[i] = huh.NewOption(d.Label(), d.ID)
	}
	c.Device = pick(devices, last.Device).ID
	return huh.NewSelect[string]().Title("Hangi cihaz?").Options(options...).Value(&c.Device).Run()
}

// pick finds a device by ID or name; without a match, the first one (a running
// simulator or emulator comes first in both lists).
func pick(devices []Device, want string) Device {
	for _, d := range devices {
		if want != "" && (d.ID == want || d.Name == want) {
			return d
		}
	}
	return devices[0]
}

func noDevices(p Platform) error {
	if p == IOS {
		return errors.New("no iOS simulator: install one in Xcode → Settings → Components")
	}
	return errors.New("no emulator and no phone: create an AVD in Android Studio, or plug a phone in with USB debugging on")
}

// repoRoot walks up from the working directory to pnpm-workspace.yaml.
func repoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "pnpm-workspace.yaml")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("not inside the Homelibra repository (no pnpm-workspace.yaml above here)")
		}
		dir = parent
	}
}

// The last choice is kept under node_modules/.cache, so it is per checkout and never committed.
func lastFile(root string) string {
	return filepath.Join(root, "node_modules", ".cache", "homelibra-dev.json")
}

func loadLast(root string) Choice {
	var c Choice
	if b, err := os.ReadFile(lastFile(root)); err == nil {
		_ = json.Unmarshal(b, &c)
	}
	return c
}

func saveLast(root string, c Choice) {
	b, _ := json.Marshal(c)
	_ = os.MkdirAll(filepath.Dir(lastFile(root)), 0o755)
	_ = os.WriteFile(lastFile(root), b, 0o644)
}
