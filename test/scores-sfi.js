var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var JsonRpcProvider = require('@ethersproject/providers').JsonRpcProvider;
var snapshot = require('../')["default"];
var networks = require('@snapshot-labs/snapshot.js/src/networks.json');
var space = 'turpintinz.eth';
var network = '1';
var snapshotBlockNumber = 13591342;
var strategies = [
    {
        "name": "saffron-finance-v2",
        "params": {
            "address": "0xb753428af26e81097e7fd17f40c88aaa3e04902c",
            "symbol": "SFI",
            "decimals": 18,
            "multiplier": 1.1
        }
    },
    {
        "name": "saffron-finance",
        "params": {
            "symbol": "SFI",
            "votingSchemes": [
                {
                    "name": "oneToOne",
                    "type": "DirectBoostScheme",
                    "multiplier": 1.0
                },
                {
                    "name": "staking",
                    "type": "DirectBoostScheme",
                    "multiplier": 1.1
                },
                {
                    "name": "uniswap",
                    "type": "LPReservePairScheme",
                    "multiplier": 1.1
                },
                {
                    "name": "sushiswap",
                    "type": "LPReservePairScheme",
                    "multiplier": 1.1
                }
            ],
            "dexLpTypes": [
                {
                    "name": "uniswap",
                    "lpToken": "0xC76225124F3CaAb07f609b1D147a31de43926cd6"
                },
                {
                    "name": "sushiswap",
                    "lpToken": "0x23a9292830Fc80dB7f563eDb28D2fe6fB47f8624"
                }
            ],
            "contracts": [
                {
                    "votingScheme": "oneToOne",
                    "label": "SFI",
                    "tokenAddress": "0xb753428af26e81097e7fd17f40c88aaa3e04902c"
                },
                {
                    "votingScheme": "oneToOne",
                    "label": "TEAM_HODL_TOKEN",
                    "tokenAddress": "0x4e5ee20900898054e998fd1862742c28c651bf5d"
                }
            ]
        }
    }
];
var addresses = [
    '0xD90B866039E8820c2Cd082840fceeD81Cef691F8',
    '0x905D6a479C4be28aF08364CE1c8e02eBC9c4bdA8',
    '0x64eacbcdbc6123bcc8b90a5fde8dd099aadb0e56',
    '0x7ba163a38a1fb4bd62096f6a76ef332f89aacf2f',
    '0x8d452c1f4bae385b13933c83ecff70d74229915f',
    '0xA43Cfc82083cd5EdaC9ABf13059bDb2447A10a80',
    '0x1c7a9275F2BD5a260A9c31069F77d53473b8ae2e',
    '0x3478697c64578D3D8092925EE365168CcabfeB66',
    '0x905D6a479C4be28aF08364CE1c8e02eBC9c4bdA8',
    '0x2ec3F80BeDA63Ede96BA20375032CDD3aAfb3030',
    '0x4AcBcA6BE2f8D2540bBF4CA77E45dA0A4a095Fa2',
    '0x4F3D348a6D09837Ae7961B1E0cEe2cc118cec777',
    '0x6D7f23A509E212Ba7773EC1b2505d1A134f54fbe',
    '0x07a1f6fc89223c5ebD4e4ddaE89Ac97629856A0f',
    '0x8d5F05270da470e015b67Ab5042BDbE2D2FEFB48',
    '0x8d07D225a769b7Af3A923481E1FdF49180e6A265',
    '0x8f60501dE5b9b01F9EAf1214dbE1924aA97F7fd0',
    '0x9B8e8dD9151260c21CB6D7cc59067cd8DF306D58',
    '0x17ea92D6FfbAA1c7F6B117c1E9D0c88ABdc8b84C',
    '0x38C0039247A31F3939baE65e953612125cB88268',
    '0x8e3c49ddfe7e2dbd7682ae548330e70f4bd1cdca',
    '0xaf13c03942bd185ffb687141563c1da508bed79e'
];
(function () { return __awaiter(_this, void 0, void 0, function () {
    var scores, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.time('getScores');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, snapshot.utils.getScoresDirect(space, strategies, network, new JsonRpcProvider(networks[network].rpc[0]), addresses, snapshotBlockNumber)];
            case 2:
                scores = _a.sent();
                console.log(scores);
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.log('getScores failed');
                console.error(e_1);
                return [3 /*break*/, 4];
            case 4:
                console.timeEnd('getScores');
                return [2 /*return*/];
        }
    });
}); })();
