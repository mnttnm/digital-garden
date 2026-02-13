/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API URL - Your digital garden capture API URL (e.g., https://yoursite.vercel.app) */
  "captureApiUrl": string,
  /** API Key - Your CAPTURE_API_KEY from environment variables */
  "captureApiKey": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `capture` command */
  export type Capture = ExtensionPreferences & {}
  /** Preferences accessible in the `quick-capture` command */
  export type QuickCapture = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `capture` command */
  export type Capture = {}
  /** Arguments passed to the `quick-capture` command */
  export type QuickCapture = {}
}

