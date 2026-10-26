# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Developers creating Expo apps who need a reusable authentication flow without coupling screens to an auth vendor.

## Product Purpose

Swapstack is a free Expo boilerplate with swappable service adapters. The auth kit provides conventional account and guest flows while screens depend only on the registry's `AuthProvider` interface.

## Operating Context

Local development uses mock providers without keys. Supabase, RevenueCat, and other live adapters are selected through environment configuration in later phases.

## Capabilities and Constraints

- Email/password and OAuth interfaces, guest access, account upgrades, password recovery, verification, profiles, and deletion.
- Expo Router navigation with session-aware auth and app groups.
- Existing UI components, theme tokens, and mock-backed tests.
- No production code, credentials, or assets; no live auth adapter in Phase C.

## Brand Commitments

Use the existing Swapstack name and the neutral, developer-friendly design system in `DESIGN.md`.

## Product Principles

- Screens depend on contracts, not vendors.
- Familiar native auth patterns take priority over novelty.
- Every flow works against mocks and remains reusable in generated apps.
