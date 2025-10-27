package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"strings"

	runtime "github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

var CONFIG_FILE_PATH string

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	winUser, err := user.Current()
	if err == nil {
		CONFIG_FILE_PATH = winUser.HomeDir + "\\Documents\\alt-launcher-config.json"
		fmt.Println("CONFIG_FILE_PATH=", CONFIG_FILE_PATH)
	} else {
		runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
			Title:   "Ошибка",
			Message: "Ошибка получения папки с настройками:\n" + err.Error(),
			Type:    runtime.ErrorDialog,
		})
	}
	
	runtime.EventsOn(ctx, "servers:request", func(args ...interface{}) {
		go func() {
			servers, err := LoadServers()
			if err != nil {
				runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
					Title:   "Ошибка",
					Message: "Ошибка получения списка серверов:\n" + err.Error(),
					Type:    runtime.ErrorDialog,
				})
				return
			}
			runtime.EventsEmit(ctx, "servers:update", servers.Arizona, servers.ArizonaMobile, servers.Rodina)
		}()
	})

	// Game path dialogs
	runtime.EventsOn(ctx, "settings:requestFileDialog", func(args ...interface{}) {
		gameType, ok := args[0].(string)
		if !ok {
			gameType = "arizona"
		}
		
		path, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{})
		if err != nil {
			runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
				Title:   "Ошибка",
				Message: "Ошибка при открытии диалога: " + err.Error(),
				Type:    runtime.ErrorDialog,
			})
			return
		}
		if len(path) > 0 {
			gamePath := fmt.Sprintf("%s\\gta_sa.exe", path)
			_, err := os.Stat(gamePath)
			if err != nil {
				runtime.MessageDialog(ctx, runtime.MessageDialogOptions{
					Title:   "Error",
					Message: "Файл \"gta_sa.exe\" не найден в \"" + path + "\"",
					Type:    runtime.ErrorDialog,
				})
				return
			}
			runtime.EventsEmit(ctx, "settings:fileDialogPathSelected", path, gameType)
		}
	})
}

func (a *App) StartGame(name string, gamePath string, parameters []string, serverType string) error {
	if len(name) < 3 || len(name) > 22 {
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:   "Ошибка запуска игры",
			Message: "Некоррекнтный ник-нейм",
			Type:    runtime.ErrorDialog,
		})
		return nil
	}
	
	var batFile string
	var batText string
	
	// Определяем путь к игре в зависимости от типа сервера
	actualGamePath := gamePath
	if serverType == "rodina" {
		// Для Rodina используем отдельный путь если указан
		configData := a.ReadConfig()
		if len(configData) > 0 {
			var cfg Config
			if err := json.Unmarshal([]byte(configData), &cfg); err == nil && cfg.RodinaPath != "" {
				actualGamePath = cfg.RodinaPath
				fmt.Println("Using Rodina path:", actualGamePath)
			}
		}
	}
	
	if serverType == "rodina" {
		// Для Rodina создаем батник rodina-launcher.bat
		batFile = fmt.Sprintf("%s\\rodina-launcher.bat", actualGamePath)
		batText = fmt.Sprintf("@echo off\ncd /D %%~dp0\nstart gta_sa.exe %s\nexit", strings.Join(parameters, " "))
		fmt.Println("Creating Rodina bat file:", batText)
	} else {
		// Для Arizona используем старую логику
		batFile = fmt.Sprintf("%s\\alternative-launcher.bat", actualGamePath)
		batText = fmt.Sprintf("@echo off\ncd /D %%~dp0\nstart gta_sa.exe %s\nexit", strings.Join(parameters, " "))
		fmt.Println("Creating Arizona bat file:", batText)
	}
	
	fmt.Println("[CREATING BAT]:", batText)
	err := os.WriteFile(batFile, []byte(batText), 0644)
	if err != nil {
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:   "Ошибка запуска игры",
			Message: fmt.Sprintf("Ошибка: %s", err.Error()),
			Type:    runtime.ErrorDialog,
		})
		return err
	}
	
	// Запускаем созданный батник
	cmd := exec.Command("cmd", "/C", batFile)
	err = cmd.Run()
	if err != nil {
		fmt.Println("Error running bat file:", err)
		return err
	}
	
	return nil
}

func (a *App) ReadConfig() string {
	bytes, err := os.ReadFile(CONFIG_FILE_PATH)
	if err != nil {
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:   "Ваши настройки не были загружены",
			Message: fmt.Sprintf("Произошла ошибка при чтении файла настроек: %s\nБыли загружены стандартные настройки.", err.Error()),
			Type:    runtime.InfoDialog,
		})
		return ""
	}
	return string(bytes)
}

func (a *App) SaveConfig(json string) {
	fmt.Println("SAVE CONFIG:", json)
	err := os.WriteFile(CONFIG_FILE_PATH, []byte(json), 0644)
	if err != nil {
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:   "Ваши настройки не были сохранены",
			Message: "Ошибка при сохранении настроек: " + err.Error(),
			Type:    runtime.ErrorDialog,
		})
	}
}

func (a *App) UpdateServerInfo(host string) {
	server, err := getServerQueryInfo(host, 7777)
	if err == nil {
		runtime.EventsEmit(a.ctx, "server:update_players", host, server.Players, server.MaxPlayers)
	}
}