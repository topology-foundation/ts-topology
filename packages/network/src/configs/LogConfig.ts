import { LogLevel } from "typescript-logging";
import { CategoryProvider, Category } from "typescript-logging-category-style";

const provider = CategoryProvider.createProvider("topology", {
    level: LogLevel.Debug,
});

export const rootNetwork = provider.getCategory("topology::network");
