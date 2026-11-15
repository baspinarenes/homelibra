package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// Kind is what a device is: a simulator or emulator on this Mac, or a phone on USB.
type Kind string

const (
	Emulator  Kind = "emulator"  // an Android Virtual Device
	Phone     Kind = "phone"     // an Android phone over USB
	Simulator Kind = "simulator" // an iOS simulator
)

// Device is one place the app can open. ID is what the tools address it by: an
// adb serial, an AVD name until it boots, or a simulator UDID.
type Device struct {
	ID      string
	Name    string
	Kind    Kind
	Running bool
}

func (d Device) Label() string {
	state := "kapalı"
	if d.Running {
		state = "açık"
	}
	kind := map[Kind]string{Emulator: "emülatör", Phone: "telefon", Simulator: "simülatör"}[d.Kind]
	return fmt.Sprintf("%s  (%s, %s)", d.Name, kind, state)
}

// --- parsing: pure, tested ---

// adbSerials reads `adb devices -l`: each attached device's serial, and its model
// when adb names one. Unauthorised or offline devices are left out.
func parseAdbDevices(out string) []Device {
	var devices []Device
	sc := bufio.NewScanner(strings.NewReader(out))
	for sc.Scan() {
		fields := strings.Fields(sc.Text())
		if len(fields) < 2 || fields[1] != "device" {
			continue
		}
		d := Device{ID: fields[0], Name: fields[0], Kind: Phone, Running: true}
		if strings.HasPrefix(d.ID, "emulator-") {
			d.Kind = Emulator
		}
		for _, f := range fields[2:] {
			if model, ok := strings.CutPrefix(f, "model:"); ok {
				d.Name = strings.ReplaceAll(model, "_", " ")
			}
		}
		devices = append(devices, d)
	}
	return devices
}

// parseAvds reads `emulator -list-avds`: one AVD name per line (the emulator may
// print INFO lines first).
func parseAvds(out string) []string {
	var names []string
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.Contains(line, " ") || strings.HasPrefix(line, "INFO") {
			continue
		}
		names = append(names, line)
	}
	return names
}

// parseSimctl reads `xcrun simctl list devices available -j`: every iPhone and
// iPad simulator, booted ones first, then by name.
func parseSimctl(out []byte) ([]Device, error) {
	var list struct {
		Devices map[string][]struct {
			UDID        string `json:"udid"`
			Name        string `json:"name"`
			State       string `json:"state"`
			IsAvailable bool   `json:"isAvailable"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(out, &list); err != nil {
		return nil, err
	}
	var devices []Device
	for runtime, sims := range list.Devices {
		if !strings.Contains(runtime, "iOS") {
			continue
		}
		for _, s := range sims {
			if !s.IsAvailable {
				continue
			}
			devices = append(devices, Device{ID: s.UDID, Name: s.Name, Kind: Simulator, Running: s.State == "Booted"})
		}
	}
	sort.SliceStable(devices, func(i, j int) bool {
		if devices[i].Running != devices[j].Running {
			return devices[i].Running
		}
		return devices[i].Name < devices[j].Name
	})
	return devices, nil
}

// --- discovery ---

func androidSdk() string {
	if sdk := os.Getenv("ANDROID_HOME"); sdk != "" {
		return sdk
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Library", "Android", "sdk")
}

func adbPath() string {
	if p, err := exec.LookPath("adb"); err == nil {
		return p
	}
	return filepath.Join(androidSdk(), "platform-tools", "adb")
}

func emulatorPath() string {
	if p, err := exec.LookPath("emulator"); err == nil {
		return p
	}
	return filepath.Join(androidSdk(), "emulator", "emulator")
}

// avdName asks a running emulator which AVD it is.
func avdName(serial string) string {
	out, err := exec.Command(adbPath(), "-s", serial, "emu", "avd", "name").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(strings.SplitN(string(out), "\n", 2)[0])
}

// AndroidDevices lists running emulators and phones, then AVDs that are not
// running: emulators first, so the default is a simulator, not a phone.
func AndroidDevices() []Device {
	var devices []Device
	running := map[string]bool{}
	if out, err := exec.Command(adbPath(), "devices", "-l").Output(); err == nil {
		for _, d := range parseAdbDevices(string(out)) {
			if d.Kind == Emulator {
				if name := avdName(d.ID); name != "" {
					d.Name = name
					running[name] = true
				}
			}
			devices = append(devices, d)
		}
	}
	if out, err := exec.Command(emulatorPath(), "-list-avds").Output(); err == nil {
		for _, name := range parseAvds(string(out)) {
			if !running[name] {
				devices = append(devices, Device{ID: name, Name: name, Kind: Emulator})
			}
		}
	}
	sort.SliceStable(devices, func(i, j int) bool {
		return devices[i].Kind == Emulator && devices[j].Kind != Emulator
	})
	return devices
}

func IOSDevices() []Device {
	out, err := exec.Command("xcrun", "simctl", "list", "devices", "available", "-j").Output()
	if err != nil {
		return nil
	}
	devices, _ := parseSimctl(out)
	return devices
}

// --- booting ---

// BootAndroid starts an AVD that is not running and waits until Android has
// booted, returning the adb serial it came up as.
func BootAndroid(d Device) (string, error) {
	if d.Running {
		return d.ID, nil
	}
	step("Emülatör açılıyor: " + d.Name)
	cmd := exec.Command(emulatorPath(), "-avd", d.ID)
	detach(cmd)
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("emulator -avd %s: %w", d.ID, err)
	}
	deadline := time.Now().Add(3 * time.Minute)
	for time.Now().Before(deadline) {
		time.Sleep(2 * time.Second)
		out, _ := exec.Command(adbPath(), "devices", "-l").Output()
		for _, r := range parseAdbDevices(string(out)) {
			if r.Kind != Emulator || avdName(r.ID) != d.ID {
				continue
			}
			booted, _ := exec.Command(adbPath(), "-s", r.ID, "shell", "getprop", "sys.boot_completed").Output()
			if strings.TrimSpace(string(booted)) == "1" {
				return r.ID, nil
			}
		}
	}
	return "", fmt.Errorf("%s did not boot in 3 minutes", d.Name)
}

// BootIOS boots a simulator, shows Simulator.app and waits until it has booted.
func BootIOS(d Device) error {
	if !d.Running {
		step("Simülatör açılıyor: " + d.Name)
		// "Unable to boot device in current state: Booted" is fine.
		_ = exec.Command("xcrun", "simctl", "boot", d.ID).Run()
	}
	_ = exec.Command("open", "-a", "Simulator").Run()
	return exec.Command("xcrun", "simctl", "bootstatus", d.ID, "-b").Run()
}
