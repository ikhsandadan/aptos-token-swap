import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { AccountAddress } from "@aptos-labs/ts-sdk";

export function compilePackage(
    packageDir: string,
    outputFile: string,
    namedAddresses: Array<{ name: string; address: AccountAddress }>,
) {
    console.log("In order to run compilation, you must have the `aptos` CLI installed.");
    try {
        execSync("aptos --version");
    } catch (e) {
        console.log("aptos is not installed. Please install it from the instructions on aptos.dev");
    }

    const addressArg = namedAddresses.map(({ name, address }) => `${name}=${address}`).join(" ");

    const compileCommand = `aptos move build-publish-payload --json-output-file ${outputFile} --package-dir ${packageDir} --named-addresses ${addressArg} --assume-yes`;
    console.log("Running the compilation locally, in a real situation you may want to compile this ahead of time.");
    console.log(compileCommand);
    execSync(compileCommand);
}

export function getPackageBytesToPublish(filePath: string) {
    const cwd = process.cwd();
    const modulePath = path.join(cwd, filePath);

    const jsonData = JSON.parse(fs.readFileSync(modulePath, "utf8"));

    const metadataBytes = jsonData.args[0].value;
    const byteCode = jsonData.args[1].value;

    return { metadataBytes, byteCode };
}