# Free Sleep — Local Control for 8 Sleep Pods

Personal fork of [free-sleep](https://github.com/throwaway31265/free-sleep).

## [Installation Instructions](./INSTALLATION.md)

## Overview

Free Sleep is an open-source project that lets you control your Eight Sleep Pod locally — without relying on the cloud or the official app.

Each Pod runs a small Linux computer inside it. Free Sleep installs a lightweight server on that computer, giving you full local control.

- **Server**: Runs directly on the Pod and talks to its hardware using custom APIs.
- **App**: A simple web interface for changing temperatures, schedules, alarms, and settings.

## Compatibility

- Pod 1 - NOT COMPATIBLE
- Pod 2 - NOT COMPATIBLE
- Pod 3 (With SD card) - Supported
- Pod 3 (No SD card) - Supported (FCC ID: 2AYXT61100001)
- Pod 4 - Supported
- Pod 5 - Supported

## Tech Stack

- **Server**: Node.js, Express, TypeScript
- **App**: React, Material-UI, Zustand, React Query
- **Database**: LowDB for simple JSON-based storage

## Developing

- [Front-end](app/README_APP.md)
- [Back-end](server/README_SERVER.md)
- [API](server/API.md)

## License

This project is licensed under the MIT License. See `LICENSE.md` for details.

## Acknowledgments

- Original project by [throwaway31265](https://github.com/throwaway31265/free-sleep)
- [@bobobo1618](https://github.com/bobobo1618) for research on device control via dac.sock
