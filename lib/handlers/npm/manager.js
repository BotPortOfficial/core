import { promises as fs } from "fs";
import path from "path";
import { Arborist } from "@npmcli/arborist";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

class AutoInstaller {
  constructor(srcDir = "./src", options = {}) {
    this.srcDir = srcDir;
    this.options = {
      prompt: true,
      verbose: false,
      silent: false,
      ...options,
    };
    this.knownPackages = new Set();
  }

  async scanForDependencies() {
    try {
      const files = await this.getAllJSFiles(this.srcDir);
      const dependencies = new Set();

      for (const file of files) {
        try {
          const content = await fs.readFile(file, "utf8");
          const imports = this.extractImports(content);

          for (const imp of imports) {
            if (this.isExternalPackage(imp)) {
              dependencies.add(this.getPackageName(imp));
            }
          }
        } catch (error) {
          if (this.options.verbose) {
            console.warn(`⚠️  Could not read file ${file}:`, error.message);
          }
        }
      }

      return Array.from(dependencies);
    } catch (error) {
      if (!this.options.silent) {
        console.error("Error scanning for dependencies:", error.message);
      }
      return [];
    }
  }

  extractImports(content) {
    const imports = new Set();

    const es6Patterns = [
      /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /import\s+['"`]([^'"`]+)['"`]/g,
    ];

    const cjsRegex = /require\(['"`]([^'"`]+)['"`]\)/g;

    [...es6Patterns, cjsRegex].forEach((regex) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        imports.add(match[1]);
      }
    });

    return Array.from(imports);
  }

  isExternalPackage(importPath) {
    return (
      !importPath.startsWith(".") &&
      !importPath.startsWith("/") &&
      !this.isBuiltinModule(importPath)
    );
  }

  isBuiltinModule(moduleName) {
    const packageName = moduleName.split("/")[0];

    const builtins = [
      "fs",
      "path",
      "http",
      "https",
      "crypto",
      "os",
      "util",
      "stream",
      "events",
      "url",
      "querystring",
      "buffer",
      "process",
      "timers",
      "console",
      "module",
      "cluster",
      "child_process",
      "worker_threads",
      "async_hooks",
      "perf_hooks",
      "inspector",
      "readline",
      "repl",
      "tty",
      "net",
      "dgram",
      "dns",
      "domain",
      "punycode",
      "string_decoder",
      "zlib",
      "assert",
      "constants",
      "vm",
    ];

    try {
      const resolved = require.resolve(packageName);
      if (resolved === packageName) return true;
    } catch {}

    return builtins.includes(packageName);
  }

  getPackageName(importPath) {
    if (importPath.startsWith("@")) {
      const parts = importPath.split("/");
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    }
    return importPath.split("/")[0];
  }

  async getAllJSFiles(dir) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (
            !["node_modules", ".git", "dist", "build", ".next"].includes(
              entry.name
            )
          ) {
            files.push(...(await this.getAllJSFiles(fullPath)));
          }
        } else if (entry.name.match(/\.(js|ts|jsx|tsx|mjs|cjs)$/)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`⚠️  Could not read directory ${dir}:`, error.message);
      }
    }

    return files;
  }

  async installMissing() {
    try {
      const needed = await this.scanForDependencies();
      const packageJson = await this.getPackageJson();
      const installed = new Set([
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
      ]);

      const missing = needed.filter((pkg) => !installed.has(pkg));

      if (missing.length === 0) {
        if (this.options.verbose)
          console.log("✅ All dependencies already installed");
        return { installed: [], skipped: needed };
      }

      if (this.options.prompt) {
        console.log(
          `🔍 Found ${missing.length} missing packages: ${missing.join(", ")}`
        );
      }

      if (!this.options.silent) {
        console.log("📦 Installing missing dependencies...");
      }

      await this.installPackages(missing);

      if (!this.options.silent) {
        console.log("✅ Dependencies installed successfully");
      }

      return {
        installed: missing,
        skipped: needed.filter((pkg) => installed.has(pkg)),
      };
    } catch (error) {
      if (!this.options.silent) {
        console.error("❌ Failed to install dependencies:", error.message);
      }
      throw error;
    }
  }

  async installPackages(packages) {
    if (packages.length === 0) return;

    const arb = new Arborist({
      path: process.cwd(),
      save: true,
    });

    await arb.reify({
      add: packages,
      save: true,
    });
  }

  async getPackageJson() {
    try {
      const content = await fs.readFile("./package.json", "utf8");
      return JSON.parse(content);
    } catch (error) {
      if (this.options.verbose) {
        console.warn("⚠️  Could not read package.json:", error.message);
      }
      return { dependencies: {}, devDependencies: {}, peerDependencies: {} };
    }
  }

  async shouldAutoInstall() {
    const packageJson = await this.getPackageJson();

    if (packageJson.botFramework?.autoInstall === false) {
      return false;
    }

    if (process.env.BOTPORT_NO_AUTO_INSTALL === "true") {
      return false;
    }

    return true;
  }
}

export default AutoInstaller;
