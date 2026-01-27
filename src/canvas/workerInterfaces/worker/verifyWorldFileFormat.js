import { FileReader } from "terraria-world-file";
import { fileLoader } from "terraria-world-file/browser";

export default async function({ worldFile }) {
    try {
        const parser = await new FileReader().loadFile(fileLoader, worldFile);
        // parse() internally calls parseWorldProperties() which validates
        // the file format (magic number, file type, version, dimensions)
        parser.parse({
            sections: ["fileFormatHeader"]
        });
        postMessage({
            action: "RETURN_MAP_FILE_VALIDITY",
            valid: true
        });
    } catch (e) {
        postMessage({
            action: "RETURN_MAP_FILE_VALIDITY",
            valid: false
        });
    }
}
