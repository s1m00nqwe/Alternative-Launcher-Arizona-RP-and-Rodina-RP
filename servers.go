package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/user"
	"sort"
)

type ServerPlotPoint struct {
	Online int `json:"online"`
	Time   int `json:"time"`
}

type Server struct {
	Number               int               `json:"number"`
	Name                 string            `json:"name"`
	IP                   string            `json:"ip"`
	Port                 int               `json:"port"`
	Online               int               `json:"online"`
	MaxPlayers           int               `json:"maxplayers"`
	Password             bool              `json:"password"`
	VK                   string            `json:"vk"`
	TG                   string            `json:"tg"`
	Inst                 string            `json:"inst"`
	Icon                 string            `json:"icon"`
	AdditionalIps        []string          `json:"additionalIps"`
	DonateMultiplier     float64           `json:"donateMultiplier"`
	ExperienceMultiplier float64           `json:"experienceMultiplier"`
	PlotPoints           []ServerPlotPoint `json:"plotPoints"`
}

type ArizonaServerInfo struct {
	Arizona       []Server `json:"arizona"`
	ArizonaMobile []Server `json:"arizonaMobile"`
	Rodina        []Server `json:"rodina"`
}

const (
	ArizonaServersListURL string = "https://api.arizona-five.com/launcher/servers"
)

// Rodina сервера - исправлен порядок
var RodinaServers = []Server{
	{Number: 101, Name: "Центральный округ", IP: "central.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
	{Number: 102, Name: "Северный округ", IP: "northern.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
	{Number: 103, Name: "Южный округ", IP: "southern.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
	{Number: 104, Name: "Федеральный округ", IP: "federal.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
	{Number: 105, Name: "Западный округ", IP: "western.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
	{Number: 106, Name: "Восточный округ", IP: "eastern.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
	{Number: 107, Name: "Приморский округ", IP: "primorsky.rodina-rp.com", Port: 7777, Online: 0, MaxPlayers: 1000, Icon: "https://via.placeholder.com/32"},
}

func LoadServers() (ArizonaServerInfo, error) {
	var servers ArizonaServerInfo
	var err error
	var jsonBytes []byte
	var listFileReaded = false
	
	// Добавляем сервера Rodina по умолчанию
	servers.Rodina = RodinaServers
	
	winUser, err := user.Current()
	if err == nil {
		listPath := winUser.HomeDir + "\\Documents\\alt-launcher-servers.json"
		fmt.Println("Custom servers list path=", listPath)
		if _, err := os.Stat(listPath); err == nil {
			jsonBytes, err = os.ReadFile(listPath)
			fmt.Println("List file:", string(jsonBytes), err)
			if err == nil {
				listFileReaded = true
				fmt.Println("Reading servers list from file")
			}
		}
	}
	
	if !listFileReaded {
		response, err := http.Get(ArizonaServersListURL)
		if err != nil {
			return servers, err
		}
		defer response.Body.Close()
		
		jsonBytes, err = io.ReadAll(response.Body)
		if err != nil {
			return servers, err
		}
	}
	
	if len(jsonBytes) > 0 {
		err = json.Unmarshal(jsonBytes, &servers)
		if err != nil {
			fmt.Println("Error parsing JSON:", err)
			// Если ошибка парсинга, используем только Rodina сервера
			servers.Arizona = []Server{}
			servers.ArizonaMobile = []Server{}
			servers.Rodina = RodinaServers
		} else {
			// Сортируем Arizona сервера по возрастанию
			sort.Slice(servers.Arizona, func(a, b int) bool {
				return servers.Arizona[a].Number < servers.Arizona[b].Number
			})
			
			// Сортируем Arizona Mobile сервера по возрастанию
			sort.Slice(servers.ArizonaMobile, func(a, b int) bool {
				return servers.ArizonaMobile[a].Number < servers.ArizonaMobile[b].Number
			})
			
			// Сортируем Rodina сервера по возрастанию (исправляем порядок)
			sort.Slice(servers.Rodina, func(a, b int) bool {
				return servers.Rodina[a].Number < servers.Rodina[b].Number
			})
			
			// Убедимся, что Rodina сервера всегда присутствуют
			if len(servers.Rodina) == 0 {
				servers.Rodina = RodinaServers
			}
		}
	}

	return servers, nil
}