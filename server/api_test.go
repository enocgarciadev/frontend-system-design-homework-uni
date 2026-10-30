package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name, method, path string
		status int
		allow string
		body map[string]string
	}{
		{"ok", http.MethodGet, "/api/health", 200, "", map[string]string{"status":"ok", "service":"pulpestock-api"}},
		{"method not allowed", http.MethodPost, "/api/health", 405, "GET", map[string]string{"error":"Method Not Allowed"}},
		{"unknown route", http.MethodGet, "/api/missing", 404, "", map[string]string{"error":"Not Found"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			NewHandler().ServeHTTP(w, r)
			resp := w.Result()
			defer resp.Body.Close()
			if resp.StatusCode != tt.status { t.Fatalf("status = %d; want %d", resp.StatusCode, tt.status) }
			if !strings.HasPrefix(resp.Header.Get("Content-Type"), "application/json") { t.Errorf("not JSON: %s", resp.Header.Get("Content-Type")) }
			if resp.Header.Get("Cache-Control") != "no-store" { t.Error("health response must not be cached") }
			if resp.Header.Get("X-Content-Type-Options") != "nosniff" { t.Error("nosniff header missing") }
			if resp.Header.Get("Allow") != tt.allow { t.Errorf("Allow = %s; want %s", resp.Header.Get("Allow"), tt.allow) }
			var body map[string]string
			if err := json.NewDecoder(resp.Body).Decode(&body); err != nil { t.Fatalf("invalid JSON: %v", err) }
			if !reflect.DeepEqual(body, tt.body) { t.Errorf("body = %v; want %v", body, tt.body) }
		})
	}
}
