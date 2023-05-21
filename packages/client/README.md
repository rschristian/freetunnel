<h1 align="center">Freetunnel</h1>

<div align="center">
    <img
       alt="Image of terminal running Freetunnel"
       src="https://raw.githubusercontent.com/rschristian/freetunnel/master/media/freetunnel.png"
     />
</div>
<p align="center">Create <strong>secure</strong> introspectable tunnels to your local device with a single command.</p>

---

<p align="center">
  <strong>Overview</strong> ✯
  <a href="#usage">Usage</a> ✯
  <a href="#options">All CLI Options</a> ✯
  <a href="#setup">Setup Your Own Freetunnel Server</a>
</p>

---

## Overview

Freetunnel is a tool for creating tunnels from your local development machine to a public and secure URL. This allows for easy webhook development, sharing of demo applications across networks, and using tools such as [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) which require public acess.

Freetunnel comes in two parts: a CLI tool and a server. You use the CLI tool to connect to a server host, making your localhost accessible, and the server _can_ be ran if you want your own configurable instance of Freetunnel. While I host an instance at [https://rchristian.dev](https://rchristian.dev), you might not want to use that URL and slots are limited; to ensure my infrastructure is never burdened, there can only be 3 sites using that instance at one time. Additionally, service may go down without warning.

## Usage

To begin using Freetunnel immediately, run:

```bash
$ npx @rschristian/freetunnel
```

This will connect `http://localhost:3000` on your local machine to `https://my-app.rchristian.dev`.

## All CLI Options <a name="options"></a>

```
Usage
    $ freetunnel [options]

Options
    -s, --subdomain    Subdomain to use on remote  (default my-app)
    -r, --remote       Remote server to run on  (default rchristian.dev)
    -H, --host         Hostname to bind  (default localhost)
    -p, --port         Port to bind  (default 3000)
    -w, --web-port     Web Port to bind for introspection (default 4040)
    -v, --version      Displays current version
    -h, --help         Displays this message

Examples
    $ freetunnel -s rschristian -r freetunnel.example.com        # Connects localhost:3000 -> https://rschristian.freetunnel.example.com
    $ freetunnel -s foobar -p 6000                               # Connects localhost:6000 -> https://foobar.rchristian.dev
```

## Setup Your Own Freetunnel Server  <a name="setup"></a>

See [Server](../server/README.md#setup)

## License

[MIT](https://github.com/rschristian/freetunnel/blob/master/LICENSE)
