import chalk from "chalk";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import latestVersion from "latest-version";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getPackageInfo = () => {
  try {
    // Since this file is in lib/essentials/banner.js, we need to go up two levels to get to package.json
    const packagePath = join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
    
    return {
      version: pkg.version || "unknown",
      name: pkg.name || "unknown",
    };
  } catch (error) {
    console.error(chalk.red("Error reading package.json:"), error.message);
    return { version: "unknown", name: "unknown" };
  }
};

const getLatestVersion = async (packageName) => {
  try {
    if (packageName === "unknown") return null;
    return await latestVersion(packageName);
  } catch (error) {
    console.error(chalk.red("Error fetching latest version:"), error.message);
    return null;
  }
};

const compareVersions = (current, latest) => {
  if (!latest || current === "unknown") return null;
  
  const curParts = current.split('.').map(Number);
  const latParts = latest.split('.').map(Number);
  const len = Math.max(curParts.length, latParts.length);
  
  for (let i = 0; i < len; i++) {
    const cur = curParts[i] || 0;
    const lat = latParts[i] || 0;
    if (cur < lat) return -1;
    if (cur > lat) return 1;
  }
  return 0;
};

const logBanner = async () => {
  const { version: currentVersion, name: packageName } = getPackageInfo();

  const asciiArt = `
${chalk.cyan("    ____  ____  ______   ____  ____  ____  ______")}  
${chalk.cyan("   / __ )/ __ \\/_  __/  / __ \\/ __ \\/ __ \\/_  __/")} 
${chalk.cyan("  / __  / / / / / /    / /_/ / / / / /_/ / / /   ")} 
${chalk.cyan(" / /_/ / /_/ / / /    / ____/ /_/ / _, _/ / /    ")} 
${chalk.cyan("/_____/\\____/ /_/    /_/    \\____/_/ |_| /_/     ")}  

${chalk.white("🤖 BotPort Framework")} ${chalk.gray(`v${currentVersion}`)}
${chalk.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${chalk.green("✅ Framework successfully initialized")}`;

  console.log(asciiArt);

  if (packageName !== "unknown" && currentVersion !== "unknown") {
    try {
      const latest = await getLatestVersion(packageName);
      const cmp = compareVersions(currentVersion, latest);
      
      if (cmp === -1) {
        console.log(chalk.yellow(`📦 Update available: v${currentVersion} → v${latest}`));
        console.log(chalk.yellow(`   Run: npm update ${packageName}`));
      } else if (cmp === 0) {
        console.log(chalk.green("✅ You're running the latest version!"));
      } else if (cmp === 1) {
        console.log(chalk.blue("🚀 You're running a newer version than published!"));
      }
    } catch {
      console.log(chalk.gray("ℹ️  Could not check for updates"));
    }
  } else {
    console.log(chalk.gray("ℹ️  Package version could not be determined"));
  }

  console.log(chalk.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan("🔗 Check us out on GitHub: https://github.com/BotPortOfficial"));
  console.log(chalk.white("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
};

export default logBanner;