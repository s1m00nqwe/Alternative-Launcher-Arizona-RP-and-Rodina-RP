package main

type ConfigParam struct {
	WideScreen    bool `json:"wideScreen"`
	AutoLogin     bool `json:"autoLogin"`
	Preload       bool `json:"preload"`
	Windowed      bool `json:"windowed"`
	Seasons       bool `json:"seasons"`
	Graphics      bool `json:"graphics"`
	ShitPc        bool `json:"shitPc"`
	CefDirtyRects bool `json:"cefDirtyRects"`
	AuthCef       bool `json:"authCef"`
	Grass         bool `json:"grass"`
	OldResolution bool `json:"oldResolution"`
	HdrResolution bool `json:"hdrResolution"`
}

type FavoriteServer struct {
	Number     int    `json:"number"`
	Name       string `json:"name"`
	IP         string `json:"ip"`
	Port       int    `json:"port"`
	Online     int    `json:"online"`
	MaxPlayers int    `json:"maxplayers"`
	Icon       string `json:"icon"`
	ServerType string `json:"serverType"`
}

type Config struct {
	Name           string         `json:"name"`
	Path           string         `json:"path"`
	RodinaPath     string         `json:"rodinaPath"`
	Memory         int            `json:"memory"`
	SelectedServer int            `json:"selectedServer"`
	ServerType     string         `json:"serverType"`
	Pass           string         `json:"pass"`
	ShowPassword   bool           `json:"showPassword"`
	FavoriteServers []FavoriteServer `json:"favoriteServers"`
	Params         ConfigParam    `json:"params"`
}