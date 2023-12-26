export function assertEnvVariable(variable: string | undefined): string {
  if (variable === undefined) {
    throw new Error(`Environment variable ${variable} is not defined`);
  }

  return variable;
}
