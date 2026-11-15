package main

import (
	"os"
	"path/filepath"
	"testing"
)

func write(t *testing.T, path, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestNativeStale(t *testing.T) {
	app := t.TempDir()
	if nativeStale(app, Android) || nativeStale(app, IOS) {
		t.Fatal("no native folders: expo run prebuilds them itself, so nothing is stale")
	}

	gradle := filepath.Join(app, "android", "app", "build.gradle")
	write(t, gradle, "    applicationId 'app.homelibra'\n")
	if !nativeStale(app, Android) {
		t.Error("an android folder for app.homelibra is stale for the dev variant")
	}
	write(t, gradle, "    applicationId 'app.homelibra.dev'\n")
	if nativeStale(app, Android) {
		t.Error("an android folder for app.homelibra.dev is current")
	}

	pbx := filepath.Join(app, "ios", "Homelibra.xcodeproj", "project.pbxproj")
	write(t, pbx, "PRODUCT_BUNDLE_IDENTIFIER = app.homelibra;\n")
	if !nativeStale(app, IOS) {
		t.Error("an ios folder for app.homelibra is stale for the dev variant")
	}
	write(t, pbx, "PRODUCT_BUNDLE_IDENTIFIER = app.homelibra.dev;\n")
	if nativeStale(app, IOS) {
		t.Error("an ios folder for app.homelibra.dev is current")
	}
}
