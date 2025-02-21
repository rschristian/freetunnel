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
  <a href="#quickstart">Quickstart</a> ✯
  <a href="#usage">Usage</a>
</p>

---

## Overview

Freetunnel is a tool for creating tunnels from your local development machine to a public and secure URL. This allows for easy webhook development, sharing of demo applications across networks, and using tools such as [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) which require public acess.

Freetunnel comes as two pieces of software: a CLI client and a server. You can use the CLI to connect to a server host, making your local device publicly accessible, and the server _can_ be ran if you want your own, configurable instance of Freetunnel. While I host an instance at [https://freetunnel.ryanchristian.dev](https://freetunnel.ryanchristian.dev), you may not want to use that URL, and slots are limited. To ensure my infrastructure is never too burdened, there can only be 3 sites using that instance at one time.

## Quickstart

To begin using Freetunnel immediately, run:

```sh
$ npx @rschristian/freetunnel
```

This will connect `http://localhost:3000` on your local machine to `https://my-app.freetunnel.ryanchristian.dev`.

## Usage

Specific instructions for using the CLI or server can be found in their respective ReadMes:

- [CLI Client](./packages/client/README.md)
- [Server](./packages/server/README.md)

## License

[MIT](https://github.com/rschristian/freetunnel/blob/master/LICENSE)
