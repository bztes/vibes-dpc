# vibes-dpc

## 0.2.0

### Minor Changes

- [`93d990a`](https://github.com/bztes/vibes-dpc/commit/93d990afb03c7ea7b86292b8fb8486cd42ddabb7) Thanks [@bztes](https://github.com/bztes)! - New design: the app opens straight into a full-screen workbench – layers on the left, a live chart canvas in the middle, climate and result on the right; on phones the canvas sits on top of a tabbed bottom sheet. Templates and saved build-ups are in a searchable library (⌘K / Ctrl+K) instead of a start page. Light and dark mode follow the device setting, and the app has a new icon. Templates now live at `/<id>` and build-ups saved in this browser at `/local/<id>`; old `/calculator/<id>` links redirect.

- [`eae8e3d`](https://github.com/bztes/vibes-dpc/commit/eae8e3dc21fcf2296b0c4af7fa3af44140d4df03) Thanks [@bztes](https://github.com/bztes)! - Replace Better Auth with a built-in session implementation. `BETTER_AUTH_SECRET` is no longer needed, sign-in attempts are rate-limited and stricter password rules apply. Existing accounts are removed on upgrade – the first account registered afterwards becomes the admin.

### Patch Changes

- [`39ff674`](https://github.com/bztes/vibes-dpc/commit/39ff67493f421ebe3f58a6b57a8305c91d0e44b2) Thanks [@bztes](https://github.com/bztes)! - Fix the arm64 docker build

- [`54ed88c`](https://github.com/bztes/vibes-dpc/commit/54ed88c757e8fb857c93363657ad3f45f0c67522) Thanks [@bztes](https://github.com/bztes)! - The material picker and the outdoor climate preset menu open upwards when there is not enough room below, and towards the other side when they would run off the edge of the screen.

## 0.1.1

### Patch Changes

- [`7eaac3e`](https://github.com/bztes/vibes-dpc/commit/7eaac3e982d7900bbf6d95b67e0eb4be86e6b142) Thanks [@bztes](https://github.com/bztes)! - Publish the Docker image for `linux/arm64` in addition to `linux/amd64`.

## 0.1.0

### Minor Changes

- [`cc47b8e`](https://github.com/bztes/vibes-dpc/commit/cc47b8e487a4b012e9a732639324bd199775e3f7) Thanks [@bztes](https://github.com/bztes)! - Initial release.
