package main

import (
	"reflect"
	"testing"
)

func TestParseAdbDevices(t *testing.T) {
	out := `List of devices attached
emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu64a transport_id:1
R5CT1234ABC            device usb:1-1 product:a54xeea model:SM_A546B device:a54x transport_id:2
0123456789             unauthorized usb:1-2 transport_id:3
emulator-5556          offline transport_id:4

`
	got := parseAdbDevices(out)
	want := []Device{
		{ID: "emulator-5554", Name: "sdk gphone64 arm64", Kind: Emulator, Running: true},
		{ID: "R5CT1234ABC", Name: "SM A546B", Kind: Phone, Running: true},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %+v\nwant %+v", got, want)
	}
}

func TestParseAvds(t *testing.T) {
	out := "INFO    | Storing crashdata in: /tmp/android/emu-crash.db\nPixel_8\nPixel_Tablet\n\n"
	if got, want := parseAvds(out), []string{"Pixel_8", "Pixel_Tablet"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestParseSimctlPutsBootedFirstAndSkipsOtherRuntimes(t *testing.T) {
	out := []byte(`{"devices": {
  "com.apple.CoreSimulator.SimRuntime.iOS-26-0": [
    {"udid": "B", "name": "iPhone 17", "state": "Shutdown", "isAvailable": true},
    {"udid": "A", "name": "iPhone 17 Pro", "state": "Booted", "isAvailable": true},
    {"udid": "C", "name": "iPad Air", "state": "Shutdown", "isAvailable": false}
  ],
  "com.apple.CoreSimulator.SimRuntime.watchOS-26-0": [
    {"udid": "W", "name": "Apple Watch", "state": "Shutdown", "isAvailable": true}
  ]
}}`)
	got, err := parseSimctl(out)
	if err != nil {
		t.Fatal(err)
	}
	want := []Device{
		{ID: "A", Name: "iPhone 17 Pro", Kind: Simulator, Running: true},
		{ID: "B", Name: "iPhone 17", Kind: Simulator},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %+v\nwant %+v", got, want)
	}
}

func TestPickMatchesIDOrNameAndFallsBackToFirst(t *testing.T) {
	devices := []Device{{ID: "emulator-5554", Name: "Pixel_8"}, {ID: "R5CT", Name: "SM A546B"}}
	cases := []struct{ in, id string }{
		{"SM A546B", "R5CT"},
		{"R5CT", "R5CT"},
		{"Pixel_8", "emulator-5554"},
		{"", "emulator-5554"},
		{"gone", "emulator-5554"},
	}
	for _, c := range cases {
		if got := pick(devices, c.in).ID; got != c.id {
			t.Errorf("pick(%q) = %s, want %s", c.in, got, c.id)
		}
	}
}

func TestDevClientURLPointsAtThisMetro(t *testing.T) {
	want := "homelibra://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
	if got := devClientURL(); got != want {
		t.Fatalf("got %s, want %s", got, want)
	}
}
