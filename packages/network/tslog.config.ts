import { ILogObj, ISettingsParam } from "tslog"

// https://tslog.js.org/#/?id=settings
const tslogconfig: ISettingsParam<ILogObj> = {
    minLevel: 3, // 3 = INFO
    type: "hidden", // "pretty" | "json" | "hidden" 
    hideLogPositionForProduction: true,
};

export default tslogconfig;