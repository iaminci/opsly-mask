# Contributing to Opsly Mask

Thanks for taking the time to contribute to Opsly Mask.

The goal of this project is to improve secure sharing and masking workflows for developers and DevOps engineers while keeping everything local-first and practical.

Please keep contributions focused, practical, and aligned with the philosophy of the project.

---

## Development Setup

Clone the repository:

```bash
git clone https://github.com/iaminci/opsly-mask.git
cd opsly-mask
```

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

---

## Before Submitting Changes

Please ensure the following pass before opening a PR:

```bash
pnpm lint
pnpm build
```

If applicable:

* test masking workflows
* test encryption/decryption flows
* verify markdown rendering behavior
* verify clipboard interactions
* verify responsive layouts

---

## Pull Request Guidelines

* Keep PRs focused and scoped
* Avoid unrelated refactors
* Write clear commit messages
* Explain the problem being solved
* Include screenshots for UI changes when possible

---

## Reporting Issues

When opening issues, please include:

* browser and OS information
* reproduction steps
* expected behavior
* screenshots if relevant

---

## Philosophy

Opsly Mask is intentionally designed to stay:

* local-first
* lightweight
* security-focused
* workflow-focused
* practical over flashy

Please avoid introducing unnecessary complexity or features that conflict with those goals.
