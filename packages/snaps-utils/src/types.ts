import {
  SnapFunctionExports,
  SnapKeyring as Keyring,
} from '@metamask/snaps-types';
import { assertStruct, Json } from '@metamask/utils';
import { valid as validSemver } from 'semver';
import {
  Infer,
  is,
  object,
  optional,
  pattern,
  refine,
  size,
  string,
  type,
} from 'superstruct';
import { SnapManifest } from './manifest/validation';

export enum NpmSnapFileNames {
  PackageJson = 'package.json',
  Manifest = 'snap.manifest.json',
}

/**
 * A struct for validating a version string.
 */
export const VersionStruct = refine(string(), 'Version', (value) => {
  return validSemver(value) !== null;
});

export const NameStruct = size(
  pattern(
    string(),
    /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/u,
  ),
  1,
  214,
);

// Note we use `type` instead of `object` here, because the latter does not
// allow unknown keys.
export const NpmSnapPackageJsonStruct = type({
  version: VersionStruct,
  name: NameStruct,
  main: optional(size(string(), 1, Infinity)),
  repository: optional(
    object({
      type: size(string(), 1, Infinity),
      url: size(string(), 1, Infinity),
    }),
  ),
});

export type NpmSnapPackageJson = Infer<typeof NpmSnapPackageJsonStruct> &
  Record<string, any>;

/**
 * Check if the given value is a valid {@link NpmSnapPackageJson} object.
 *
 * @param value - The value to check.
 * @returns Whether the value is a valid {@link NpmSnapPackageJson} object.
 */
export function isNpmSnapPackageJson(
  value: unknown,
): value is NpmSnapPackageJson {
  return is(value, NpmSnapPackageJsonStruct);
}

/**
 * Asserts that the given value is a valid {@link NpmSnapPackageJson} object.
 *
 * @param value - The value to check.
 * @throws If the value is not a valid {@link NpmSnapPackageJson} object.
 */
export function assertIsNpmSnapPackageJson(
  value: unknown,
): asserts value is NpmSnapPackageJson {
  assertStruct(
    value,
    NpmSnapPackageJsonStruct,
    `"${NpmSnapFileNames.PackageJson}" is invalid`,
  );
}

/**
 * An object for storing parsed but unvalidated Snap file contents.
 */
export type UnvalidatedSnapFiles = {
  manifest?: Json;
  packageJson?: Json;
  sourceCode?: string;
  svgIcon?: string;
};

/**
 * An object for storing the contents of Snap files that have passed JSON
 * Schema validation, or are non-empty if they are strings.
 */
export type SnapFiles = {
  manifest: SnapManifest;
  packageJson: NpmSnapPackageJson;
  sourceCode: string;
  svgIcon?: string;
};

/**
 * The possible prefixes for snap ids.
 */
export enum SnapIdPrefixes {
  npm = 'npm:',
  local = 'local:',
}

export type SnapId = string;

/**
 * Snap validation failure reason codes that are programmatically fixable
 * if validation occurs during development.
 */
export enum SnapValidationFailureReason {
  NameMismatch = '"name" field mismatch',
  VersionMismatch = '"version" field mismatch',
  RepositoryMismatch = '"repository" field mismatch',
  ShasumMismatch = '"shasum" field mismatch',
}

export enum SNAP_STREAM_NAMES {
  JSON_RPC = 'jsonRpc',
  COMMAND = 'command',
}

export enum HandlerType {
  OnRpcRequest = 'onRpcRequest',
  OnTransaction = 'onTransaction',
  SnapKeyring = 'keyring',
  OnCronjob = 'onCronjob',
}

export const SNAP_EXPORT_NAMES = Object.values(HandlerType);

export type SnapRpcHookArgs = {
  origin: string;
  handler: HandlerType;
  request: Record<string, unknown>;
};

// The snap is the callee
export type SnapRpcHook = (options: SnapRpcHookArgs) => Promise<unknown>;

type ObjectParameters<
  Type extends Record<string, (...args: any[]) => unknown>,
> = Parameters<Type[keyof Type]>;

type KeyringParameter<Fn> = Fn extends (...args: any[]) => unknown
  ? Parameters<Fn>
  : never;

type KeyringParameters = KeyringParameter<Keyring[keyof Keyring]>;

export type SnapExportsParameters =
  | ObjectParameters<SnapFunctionExports>
  | KeyringParameters;
