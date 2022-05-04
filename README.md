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
  <a href="#setup">Setup Your Own Freetunnel Server</a> ✯
  <a href="#options">All CLI Options</a>
</p>

---

## Overview

Freetunnel is a tool for creating tunnels from your local development machine to a public and secure URL. This allows for easy webhook development, sharing of demo applications across networks, and using tools such as [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) which require public acess.

Freetunnel comes in two parts: a CLI tool and a server. You use the CLI tool to connect to a server host, making your localhost accessible, and the server _can_ be ran if you want your own configurable instance of Freetunnel. While I host an instance at [https://freetunnel.ryanchristian.dev](https://freetunnel.ryanchristian.dev), you might not want to use that URL, and slots are limited. To ensure my infrastructure is never too burdened, there can only be 5 sites using that instance at one without the server password.

## Usage <a name="usage"></a>

To begin using Freetunnel immediately, run:

```bash
$ npx @rschristian/freetunnel
```

This will connnect `http://localhost:3000` to `https://foo.freetunnel.ryanchristian.dev`.

## Setup

If you'd like to run your own instance of Freetunnel, maybe because you dislike the domain or the free slots are full (I only provide 5 slots for free on a first-come first-served basis), you're easily able to with a Docker container I've set up. Simply run the following to start up your own instance:

```bash
$ docker run -d \
  -p 3000:3000 \
  ryanchristian4427/freetunnel
```

You have a few options to customize using environment variables, if you'd like:

```
FREETUNNEL_PORT (default 3000)

FREETUNNEL_PASSWORD (default undefined)

FREETUNNEL_MAX_FREE_SUBDOMAINS (default 5)
```

To configure these with Docker, use the following:

```bash
$ docker run -d \
  -p 3000:3000 \
  -e FREETUNNEL_PORT=3000 \
  -e FREETUNNEL_PASSWORD=my_password \
  -e FREETUNNEL_MAX_FREE_SUBDOMAINS=5 \
  ryanchristian4427/freetunnel
```

## All CLI Options <a name="options"></a>

```
Usage
    $ freetunnel [options]

Options
    -s, --subdomain    Subdomain to use on remote  (default foo)
    -r, --remote       Remote server to run on  (default freetunnel.ryanchristian.dev)
    -H, --host         Hostname to bind  (default localhost)
    -p, --port         Port to bind  (default 3000)
    -w, --web-port     Web Port to bind for introspection (default 4040)
    -P, --password     Password to use for the remote
    -v, --version      Displays current version
    -h, --help         Displays this message

Examples
    $ freetunnel -s rschristian -r freetunnel.hdimitrov.com      # Connects localhost:3000 -> https://rschristian.freetunnel.hdimitrov.com
    $ freetunnel -s foobar -r tunnel.lukewarlow.uk -p 6000       # Connects localhost:6000 -> https://foobar.tunnel.lukewarlow.uk
    $ freetunnel -s api -P password123                           # Connects localhost:3000 -> https://api.freetunnel.ryanchristian.dev
```

## License

[MIT](https://github.com/rschristian/freetunnel/blob/master/LICENSE)

## Acknowledgments

Project forked from https://gitlab.com/hdimitrov/freetunnel
