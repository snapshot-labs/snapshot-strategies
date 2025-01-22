import { readFileSync } from 'fs';
import path from 'path';

import * as subgraphSplitDelegation from './subgraph-split-delegation';
import * as polygonSelfStaked from './polygon-self-staked-pol';
import * as delegatexyzErc721BalanceOf from './delegatexyz-erc721-balance-of';
import * as urbitGalaxies from './urbit-galaxies/index';
import * as ecoVotingPower from './eco-voting-power';
import * as ecoMultichainVotingPower from './eco-multichain-voting-power';
import * as dpsNFTStrategy from './dps-nft-strategy';
import * as dpsNFTStrategyNova from './dps-nft-strategy-nova';
import * as nounsPower from './nouns-rfp-power';
import * as erc20Votes from './erc20-votes';
import * as erc20VotesWithOverride from './erc20-votes-with-override';
import * as antiWhale from './anti-whale';
import * as balancer from './balancer';
import * as balancerSmartPool from './balancer-smart-pool';
import * as contractCall from './contract-call';
import * as dfynFarms from './dfyn-staked-in-farms';
import * as dfynVaults from './dfyn-staked-in-vaults';
import * as vDfynVault from './balance-in-vdfyn-vault';
import * as ensDomainsOwned from './ens-domains-owned';
import * as ensReverseRecord from './ens-reverse-record';
import * as ens10kClub from './ens-10k-club';
import * as ensAllClubDigits from './ens-all-club-digits';
import * as governorDelegator from './governor-delegator';
import * as erc20BalanceOf from './erc20-balance-of';
import * as erc20BalanceOfAt from './erc20-balance-of-at';
import * as erc20BalanceOfCoeff from './erc20-balance-of-coeff';
import * as erc20BalanceOfFixedTotal from './erc20-balance-of-fixed-total';
import * as erc20BalanceOfCv from './erc20-balance-of-cv';
import * as erc20WithBalance from './erc20-with-balance';
import * as erc20BalanceOfDelegation from './erc20-balance-of-delegation';
import * as erc20BalanceOfWithDelegation from './erc20-balance-of-with-delegation';
import * as erc20BalanceOfQuadraticDelegation from './erc20-balance-of-quadratic-delegation';
import * as erc20BalanceOfTopHolders from './erc20-balance-of-top-holders';
import * as erc20BalanceOfWeighted from './erc20-balance-of-weighted';
import * as ethalendBalanceOf from './ethalend-balance-of';
import * as prepoVesting from './prepo-vesting';
import * as erc20BalanceOfIndexed from './erc20-balance-of-indexed';
import * as revest from './revest';
import * as erc20Price from './erc20-price';
import * as balanceOfWithMin from './balance-of-with-min';
import * as balanceOfWithMax from './balance-of-with-max';
import * as balanceOfWithThresholds from './balance-of-with-thresholds';
import * as balanceOfWithLinearVestingPower from './balance-of-with-linear-vesting-power';
import * as linearVestingPower from './linear-vesting-power';
import * as thresholds from './thresholds';
import * as ethBalance from './eth-balance';
import * as ethWithBalance from './eth-with-balance';
import * as ethWalletAge from './eth-wallet-age';
import * as multichain from './multichain';
import * as gooddollarMultichain from './gooddollar-multichain';
import * as makerDsChief from './maker-ds-chief';
import * as uni from './uni';
import * as yearnVault from './yearn-vault';
import * as fraxFinance from './frax-finance';
import * as fraxFinanceFraxtal from './frax-finance-fraxtal';
import * as moloch from './moloch';
import * as uniswap from './uniswap';
import * as faralandStaking from './faraland-staking';
import * as flashstake from './flashstake';
import * as pancake from './pancake';
import * as pancakeProfile from './pancake-profile';
import * as synthetix from './synthetix';
import * as aelinCouncil from './aelin-council';
import * as ctoken from './ctoken';
import * as stakedUniswap from './staked-uniswap';
import * as erc20Received from './erc20-received';
import * as xDaiEasyStaking from './xdai-easy-staking';
import * as xDaiPOSDAOStaking from './xdai-posdao-staking';
import * as xDaiStakeHolders from './xdai-stake-holders';
import * as xDaiStakeDelegation from './xdai-stake-delegation';
import * as defidollar from './defidollar';
import * as aavegotchi from './aavegotchi';
import * as aavegotchiAgip from './aavegotchi-agip';
import * as mithcash from './mithcash';
import * as dittomoney from './dittomoney';
import * as balancerUnipool from './balancer-unipool';
import * as sushiswap from './sushiswap';
import * as masterchef from './masterchef';
import * as stablexswap from './stablexswap';
import * as stakedKeep from './staked-keep';
import * as stakedDaomaker from './staked-daomaker';
import * as typhoon from './typhoon';
import * as delegation from './delegation';
import * as delegationWithCap from './delegation-with-cap';
import * as delegationWithOverrides from './delegation-with-overrides';
import * as withDelegation from './with-delegation';
import * as ticket from './ticket';
import * as work from './work';
import * as ticketValidity from './ticket-validity';
import * as validation from './validation';
import * as opium from './opium';
import * as ocean from './ocean-marketplace';
import * as theGraphBalance from './the-graph-balance';
import * as theGraphDelegation from './the-graph-delegation';
import * as theGraphIndexing from './the-graph-indexing';
import * as whitelist from './whitelist';
import * as whitelistWeighted from './whitelist-weighted';
import * as whitelistWeightedJson from './whitelist-weighted-json';
import * as tokenlon from './tokenlon';
import * as pobHash from './pob-hash';
import * as erc1155BalanceOf from './erc1155-balance-of';
import * as erc1155BalanceOfCv from './erc1155-balance-of-cv';
import * as erc1155WithMultiplier from './erc1155-with-multiplier';
import * as compLikeVotes from './comp-like-votes';
import * as governorAlpha from './governor-alpha';
import * as pagination from './pagination';
import * as rulerStakedLP from './ruler-staked-lp';
import * as xcover from './xcover';
import * as niuStaked from './niu-staked';
import * as mushrooms from './mushrooms';
import * as curioCardsErc20Weighted from './curio-cards-erc20-weighted';
import * as saffronFinance from './saffron-finance';
import * as saffronFinanceV2 from './saffron-finance-v2';
import * as renNodes from './ren-nodes';
import * as reverseVotingEscrow from './reverse-voting-escrow';
import * as multisigOwners from './multisig-owners';
import * as trancheStaking from './tranche-staking';
import * as pepemon from './pepemon';
import * as erc1155AllBalancesOf from './erc1155-all-balances-of';
import * as trancheStakingLP from './tranche-staking-lp';
import * as masterchefPoolBalance from './masterchef-pool-balance';
import * as masterchefPoolBalancePrice from './masterchef-pool-balance-price';
import * as api from './api';
import * as apiPost from './api-post';
import * as apiV2 from './api-v2';
import * as xseen from './xseen';
import * as molochAll from './moloch-all';
import * as molochLoot from './moloch-loot';
import * as erc721Enumerable from './erc721-enumerable';
import * as erc721WithMultiplier from './erc721-with-multiplier';
import * as erc721WithTokenId from './erc721-with-tokenid';
import * as erc721WithTokenIdRangeWeights from './erc721-with-tokenid-range-weights';
import * as erc721WithTokenIdRangeWeightsSimple from './erc721-with-tokenid-range-weights-simple';
import * as erc721WithTokenIdWeighted from './erc721-with-tokenid-weighted';
import * as erc721WithMetadata from './erc721-with-metadata';
import * as erc721WithMetadataByOwnerOf from './erc721-with-metadata-by-ownerof';
import * as hoprUniLpFarm from './hopr-uni-lp-farm';
import * as erc721 from './erc721';
import * as erc721MultiRegistry from './erc721-multi-registry';
import * as apescape from './apescape';
import * as liftkitchen from './liftkitchen';
import * as decentralandEstateSize from './decentraland-estate-size';
import * as decentralandWearableRariry from './decentraland-wearable-rarity';
import * as decentralandRentalLessors from './decentraland-rental-lessors';
import * as iotexStakedBalance from './iotex-staked-balance';
import * as xrc20BalanceOf from './xrc20-balance-of';
import * as brightid from './brightid';
import * as inverseXINV from './inverse-xinv';
import * as modefi from './modefi';
import * as spookyswap from './spookyswap';
import * as glide from './glide';
import * as rnbwBalance from './rnbw-balance';
import * as celerSgnDelegation from './celer-sgn-delegation';
import * as infinityProtocolPools from './infinityprotocol-liquidity-pools';
import * as aaveGovernancePower from './aave-governance-power';
import * as cake from './cake';
import * as aks from './aks';
import * as impossibleFinance from './impossible-finance';
import * as ogn from './ogn';
import * as oolongswap from './oolongswap';
import * as zrxVotingPower from './zrx-voting-power';
import * as tombFinance from './tomb-finance';
import * as trancheStakingSLICE from './tranche-staking-slice';
import * as unipoolUniv2Lp from './unipool-univ2-lp';
import * as unipoolXSushi from './unipool-xsushi';
import * as taraxaDelegation from './taraxa-delegation';
import * as poap from './poap';
import * as poapWithWeight from './poap-with-weight';
import * as poapWithWeightV2 from './poap-with-weight-v2';
import * as uniswapV3 from './uniswap-v3';
import * as uniswapV3Staking from './uniswap-v3-staking';
import * as l2Deversifi from './l2-deversifi';
import * as vestedDeversifi from './vested-deversifi';
import * as biswap from './biswap';
import * as honeyswap from './honeyswap';
import * as eglVote from './egl-vote';
import * as mcnFarm from './mcn-farm';
import * as meebitsdao from './meebitsdao';
import * as membership from './membership';
import * as holdsTokens from './holds-tokens';
import * as crucibleERC20BalanceOf from './crucible-erc20-balance-of';
import * as erc20TokenAndLpWeighted from './erc20-token-and-lp-weighted';
import * as erc20TokenAndSingleLpWeighted from './erc20-token-and-single-lp-weighted';
import * as crucibleERC20TokenAndLpWeighted from './crucible-erc20-token-and-lp-weighted';
import * as hasrock from './has-rock';
import * as flexaCapacityStaking from './flexa-capacity-staking';
import * as sunriseGamingUniv2Lp from './sunrisegaming-univ2-lp';
import * as sunriseGamingStaking from './sunrisegaming-staking';
import * as singleStakingAutoCompoundBalanceOf from './single-staking-autocompound-balanceof';
import * as singleStakingLongTermStakingBalanceOf from './single-staking-longtermstaking-balanceof';
import * as singleStakingPoolsBalanceOf from './single-staking-pools-balanceof';
import * as occStakeOf from './occ-stake-of';
import * as hoprBridgedBalance from './hopr-bridged-balance';
import * as hoprStakeAndBalanceQV from './hopr-stake-and-balance-qv';
import * as lootCharacterGuilds from './loot-character-guilds';
import * as compLikeVotesInclusive from './comp-like-votes-inclusive';
import * as mstable from './mstable';
import * as hashesVoting from './hashes-voting';
import * as hashflowVeHft from './hashflow-vehft';
import * as aavegotchiWagmiGuild from './aavegotchi-wagmi-guild';
import * as polisBalance from './polis-balance';
import * as techQuadraticRankedChoice from './tech-quadratic-ranked-choice';
import * as mutantCatsStakersAndHolders from './mutant-cats-stakers-and-holders';
import * as razorVoting from './razor-network-voting';
import * as mcbBalanceFromGraph from './mcb-balance-from-graph';
import * as colonyReputation from './colony-reputation';
import * as digitalaxMonaQuickswap from './digitalax-mona-quickswap';
import * as digitalaxGenesisContribution from './digitalax-genesis-contribution';
import * as digitalaxLPStakers from './digitalax-lp-stakers';
import * as digitalaxMonaStakersMatic from './digitalax-mona-stakers-matic';
import * as digitalaxLPStakersMatic from './digitalax-lp-stakers-matic';
import * as galaxyNftWithScore from './galaxy-nft-with-score';
import * as galxeLoyaltyPoints from './galxe-loyalty-points';
import * as galxeStaking from './galxe-staking';
import * as gatenetTotalStaked from './gatenet-total-staked';
import * as vesper from './vesper';
import * as thales from './thales';
import * as bscMvb from './bsc-mvb';
import * as coinswap from './coinswap';
import * as dgenesis from './dgenesis';
import * as votePowerAndShare from './vote-power-and-share';
import * as math from './math';
import * as pushVotingPower from './push-voting-power';
import * as stakedPSPBalance from './staked-psp-balance';
import * as erc20BalanceOfContractMultiplier from './erc20-balance-of-contract-multiplier';
import * as juicebox from './juicebox';
import * as snetFarmers from './snet-farmers';
import * as snetStakers from './snet-stakers';
import * as snetLiquidityProviders from './snet-liquidity-providers';
import * as unstackedToadzAndStackedToadzStakers from './unstackedtoadz-and-stackedtoadz-stakers';
import * as oceanDAOBrightID from './ocean-dao-brightid';
import * as lydiaGovVault from './lydia-gov-vault';
import * as darkforestScore from './darkforest-score';
import * as orangeReputationBasedVoting from './orange-reputation-based-voting';
import * as orangeReputationNftBasedVoting from './orange-reputation-nft-based-voting';
import * as squidDao from './squid-dao';
import * as pathBalanceStakedAndLocked from './path-balance-staked-and-locked';
import * as bottoDao from './botto-dao';
import * as bottoDaoBase from './botto-dao-base';
import * as genart from './genart';
import * as erc721MultiRegistryWeighted from './erc721-multi-registry-weighted';
import * as balancerPoolid from './balancer-poolid';
import * as stakedBalancer from './staked-balancer';
import * as stakedUniswapModifiable from './staked-uniswap-modifiable';
import * as givethGnosisBalanceV2 from './giveth-gnosis-balance-v2';
import * as givethBalancerBalance from './giveth-balancer-balance';
import * as erc1155BalanceOfIds from './erc1155-balance-of-ids';
import * as erc1155BalanceOfIdsWeighted from './erc1155-balance-of-ids-weighted';
import * as erc1155weighted from './erc1155-weighted-by-id';
import * as stakersAndHolders from './stakers-and-holders';
import * as banksyDao from './banksy-dao';
import * as spacey2025 from './spacey2025';
import * as spacefiBlp from './spacefi-blp';
import * as sandmanDao from './sandman-dao';
import * as veBalanceOfAt from './ve-balance-of-at';
import * as veRibbon from './ve-ribbon';
import * as veRibbonVotingPower from './ve-ribbon-voting-power';
import * as chubbykaijudao from './chubbykaijudao';
import * as landDaoTiers from './landdao-token-tiers';
import * as defiplaza from './defiplaza';
import * as stakingClaimedUnclaimed from './staking-claimed-unclaimed';
import * as gysrStakingBalance from './gysr-staking-balance';
import * as gysrLPStakingBalance from './gysr-lp-staking-balance';
import * as wanakafarmStaking from './wanakafarm-staking';
import * as starsharks from './starsharks';
import * as printerFinancial from './printer-financial';
import * as ethercatsFoundersSeries from './ethercats-founders-series';
import * as potion from './potion';
import * as MinotaurMoney from './minotaur-money';
import * as convFinance from './conv-finance';
import * as sdBoost from './sd-boost';
import * as wanakafarmLandIngame from './wanakafarm-land-ingame';
import * as starcatchersTopWindow from './starcatchers-top-window';
import * as gno from './gno';
import * as masterchefPoolBalanceNoRewarddebt from './masterchef-pool-balance-no-rewarddebt';
import * as proofOfHumanity from './proof-of-humanity';
import * as samuraiLegendsGeneralsBalance from './samurailegends-generals-balance';
import * as dogsUnchained from './dogs-unchained';
import * as umamiVoting from './umami-voting';
import * as liquidityTokenProvide from './liquidity-token-provide';
import * as gamiumVoting from './gamium-voting';
import * as citydaoSquareRoot from './citydao-square-root';
import * as recusalList from './recusal-list';
import * as rowdyRoos from './rowdy-roos';
import * as ethermon721 from './ethermon-erc721';
import * as etherorcsComboBalanceOf from './etherorcs-combo-balanceof';
import * as hedgey from './hedgey';
import * as hedgeyDelegate from './hedgey-delegate';
import * as sybilProtection from './sybil-protection';
import * as veBalanceOfAtNFT from './ve-balance-of-at-nft';
import * as genzeesFromSubgraph from './genzees-from-subgraph';
import * as positionGovernancePower from './position-governance-power';
import * as creditLp from './credit-lp';
import * as helix from './helix';
import * as auraBalanceOfSingleAsset from './aura-vault-balance-of-single-asset';
import * as rocketpoolNodeOperator from './rocketpool-node-operator';
import * as rocketpoolNodeOperatorv2 from './rocketpool-node-operator-v2';
import * as rocketpoolNodeOperatorv3 from './rocketpool-node-operator-v3';
import * as rocketpoolNodeOperatorv4 from './rocketpool-node-operator-v4';
import * as rocketpoolNodeOperatorv7 from './rocketpool-node-operator-v7';
import * as rocketpoolNodeOperatorDelegatev4 from './rocketpool-node-operator-delegate-v4';
import * as rocketpoolNodeOperatorDelegatev5 from './rocketpool-node-operator-delegate-v5';
import * as rocketpoolNodeOperatorDelegatev6 from './rocketpool-node-operator-delegate-v6';
import * as rocketpoolNodeOperatorDelegatev7 from './rocketpool-node-operator-delegate-v7';
import * as rocketpoolNodeOperatorDelegatev8 from './rocketpool-node-operator-delegate-v8';
import * as earthfundChildDaoStakingBalance from './earthfund-child-dao-staking-balance';
import * as unipilotVaultPilotBalance from './unipilot-vault-pilot-balance';
import * as sdBoostTWAVP from './sd-boost-twavp';
import * as fortaShares from './forta-shares';
import * as lrcL2SubgraphBalanceOf from './lrc-l2-subgraph-balance-of';
import * as lrcL2NftBalanceOf from './lrc-l2-nft-balance-of';
import * as lrcLPSubgraphBalanceOf from './lrc-lp-subgraph-balance-of';
import * as lrcNFTmult from './lrc-nft-search-mult';
import * as bancorPoolTokenUnderlyingBalance from './bancor-pool-token-underlying-balance';
import * as balanceOfSubgraph from './balance-of-subgraph';
import * as wagdieSubgraph from './wagdie-subgraph';
import * as erc3525FlexibleVoucher from './erc3525-flexible-voucher';
import * as erc721PairWeights from './erc721-pair-weights';
import * as harmonyStaking from './harmony-staking';
import * as orcaPod from './orca-pod';
import * as metropolisPod from './metropolis-pod';
import * as proxyProtocolErc721BalanceOf from './proxyprotocol-erc721-balance-of';
import * as arrowVesting from './arrow-vesting';
import * as tutellusProtocol from './tutellus-protocol';
import * as fightClub from './fight-club';
import * as tproStaking from './tpro-staking';
import * as safeVested from './safe-vested';
import * as otterspaceBadges from './otterspace-badges';
import * as syntheticNounsClaimerOwner from './synthetic-nouns-with-claimer';
import * as echelonWalletPrimeAndCachedKey from './echelon-wallet-prime-and-cached-key';
import * as nation3VotesWIthDelegations from './nation3-votes-with-delegations';
import * as nation3CoopPassportWithDelegations from './nation3-passport-coop-with-delegations';
import * as posichainStaking from './posichain-staking';
import * as posichainTotalBalance from './posichain-total-balance';
import * as erc20TokensPerUni from './erc20-tokens-per-uni';
import * as bancorStandardRewardsUnderlyingBalance from './bancor-standard-rewards-underlying-balance';
import * as sdVoteBoost from './sd-vote-boost';
import * as sdVoteBoostTWAVP from './sd-vote-boost-twavp';
import * as ninechroniclesStakedAndDcc from './ninechronicles-staked-and-dcc';
import * as spreadsheet from './spreadsheet';
import * as offchainDelegation from './offchain-delegation';
import * as rep3Badges from './rep3-badges';
import * as marsecosystem from './marsecosystem';
import * as ari10StakingLocked from './ari10-staking-locked';
import * as skaleDelegationWeighted from './skale-delegation-weighted';
import * as cookieStaking from './cookie-staking';
import * as reliquary from './reliquary';
import * as acrossStakedAcx from './across-staked-acx';
import * as lodestarVesting from './lodestar-vesting';
import * as lodestarStakedLp from './lodestar-staked-lp';
import * as jpegdLockedJpegOf from './jpegd-locked-jpeg-of';
import * as litDaoGovernance from './lit-dao-governance';
import * as battleflyVGFLYAndStakedGFLY from './battlefly-vgfly-and-staked-gfly';
import * as nexonArmyNFT from './nexon-army-nft';
import * as moonbeamFreeBalance from './moonbeam-free-balance';
import * as stakedotlinkVesting from './stakedotlink-vesting';
import * as pspInSePSP2Balance from './psp-in-sepsp2-balance';
import * as pdnBalancesAndVests from './pdn-balances-and-vests';
import * as izumiVeiZi from './izumi-veizi';
import * as lqtyProxyStakers from './lqty-proxy-stakers';
import * as rdntCapitalVoting from './rdnt-capital-voting';
import * as stakedDefiBalance from './staked-defi-balance';
import * as degenzooErc721AnimalsWeighted from './degenzoo-erc721-animals-weighted';
import * as capVotingPower from './cap-voting-power';
import * as zunamiPoolGaugeAggregatedBalanceOf from './zunami-pool-gauge-aggregated-balance-of';
import * as erc721CollateralHeld from './erc721-collateral-held';
import * as starlayVeBalanceOfLockerId from './starlay-ve-balance-of-locker-id';
import * as winrStaking from './winr-staking';
import * as spaceid from './spaceid';
import * as delegateRegistryV2 from './delegate-registry-v2';
import * as splitDelegation from './split-delegation';
import * as hatsProtocolSingleVotePerOrg from './hats-protocol-single-vote-per-org';
import * as karmaDiscordRoles from './karma-discord-roles';
import * as seedifyHoldStakingFarming from './seedify-cumulative-voting-power-hodl-staking-farming';
import * as stakedMoreKudasai from './staked-morekudasai';
import * as sablierV1Deposit from './sablier-v1-deposit';
import * as sablierV2 from './sablier-v2';
import * as gelatoStaking from './gelato-staking';
import * as erc4626AssetsOf from './erc4626-assets-of';
import * as sdVoteBoostTWAVPV2 from './sd-vote-boost-twavp-v2';
import * as sdVoteBoostTWAVPV3 from './sd-vote-boost-twavp-v3';
import * as sdVoteBoostTWAVPV4 from './sd-vote-boost-twavp-v4';
import * as sdGaugeLessVoteBoost from './sd-gauge-less-vote-boost';
import * as sdGaugeLessVoteBoostCrosschain from './sd-gauge-less-vote-boost-crosschain';
import * as sdVoteBalanceOfTwavpPool from './sdvote-balanceof-twavp-pool';
import * as sdVoteBoostTWAVPVsdToken from './sd-vote-boost-twavp-vsdtoken';
import * as sdVoteBoostTWAVPVCrossChain from './sd-vote-boost-twavp-vsdcrv-crosschain';
import * as sdVoteBoostTWAVPBalanceof from './sd-vote-boost-twavp-balanceof';
import * as friendTech from './friend-tech';
import * as moonbase from './moonbase';
import * as dssVestUnpaid from './dss-vest-unpaid';
import * as dssVestBalanceAndUnpaid from './dss-vest-balance-and-unpaid';
import * as eoaBalanceAndStakingPools from './eoa-balance-and-staking-pools';
import * as stationScoreIfBadge from './station-score-if-badge';
import * as stationConstantIfBadge from './station-constant-if-badge';
import * as mangroveStationQVScaledToMGV from './mangrove-station-qv-scaled-to-mgv';
import * as floki from './floki';
import * as hatsProtocolHatId from './hats-protocol-hat-id';
import * as hatsProtocolHatIds from './hats-protocol-hat-ids';
import * as bubblegumKids from './bubblegum-kids';
import * as clipperStakedSail from './clipper-staked-sail';
import * as plearn from './plearn';
import * as snote from './snote';
import * as streamr from './streamr';
import * as aavegotchiAgip17 from './aavegotchi-agip-17';
import * as aavegotchiAgip37GltrStakedLp from './aavegotchi-agip-37-gltr-staked-lp';
import * as aavegotchiAgip37WapGhst from './aavegotchi-agip-37-wap-ghst';
import * as agave from './agave';
import * as arrakisFinance from './arrakis-finance';
import * as ctsiStakingPool from './ctsi-staking-pool';
import * as cyberkongzV2 from './cyberkongz-v2';
import * as dextfStakedInVaults from './dextf-staked-in-vaults';
import * as genomesdao from './genomesdao';
import * as goldfinchMembership from './goldfinch-membership';
import * as goldfinchVotingPower from './goldfinch-voting-power';
import * as h2o from './h2o';
import * as hoprStakingBySeason from './hopr-staking-by-season';
import * as hoprStakingS2 from './hopr-staking-s2';
import * as ilv from './ilv';
import * as meebitsdaoDelegation from './meebitsdao-delegation';
import * as modefiStaking from './modefi-staking';
import * as orbsNetworkDelegation from './orbs-network-delegation';
import * as planetFinanceV2 from './planet-finance-v2';
import * as rariFuse from './rari-fuse';
import * as synthetixNonQuadratic_1 from './synthetix-non-quadratic_1';
import * as synthetixQuadratic from './synthetix-quadratic';
import * as synthetixQuadratic_1 from './synthetix-quadratic_1';
import * as synthetix_1 from './synthetix_1';
import * as totalAxionShares from './total-axion-shares';
import * as unipoolSameToken from './unipool-same-token';
import * as vendorV2BorrowerCollateralBalanceOf from './vendor-v2-borrower-collateral-balance-of';
import * as voltVotingPower from './volt-voting-power';
import * as xdaiStakersAndHolders from './xdai-stakers-and-holders';
import * as minimeBalanceVsSupplyWeighted from './minime-balance-vs-supply-weighted';
import * as vestingBalanceOf from './vesting-balance-of';
import * as stakingBalanceOfV2 from './staking-balance-of-v2';
import * as poktNetworkPDA from './pokt-network-pda';
import * as givethBalancesSupplyWeighted from './giveth-balances-supply-weighted';
import * as givethGnosisBalanceSupplyWeightedV3 from './giveth-gnosis-balance-supply-weighted-v3';
import * as stakeMineLiquidHelios from './stake-mine-liquid-helios';
import * as a51Farming from './a51-farming';
import * as a51VaultBalance from './a51-vault-balance';
import * as quickswapv3 from './quickswap-v3';
import * as balanceOfWithBazaarBatchAuctionLinearVestingPower from './balance-of-with-bazaar-batch-auction-linear-vesting-power';
import * as stakingBalanceOfV1 from './staking-balance-of-v1';
import * as gardenStakes from './garden-stakes';
import * as csv from './csv';
import * as swarmStaking from './swarm-staking';
import * as mocaStaking from './moca-staking';
import * as hatsStrategy from './hats-strategy';
import * as candyLockV1Token from './candy-lockv1-token';
import * as candyLockToken from './candy-lock-token';
import * as candyAutoVault from './candy-auto-vault';
import * as candyLockNft from './candy-lock-nft';
import * as candyNftStaking from './candy-nft-staking';
import * as pom from './pom';
import * as superboring from './superboring';
import * as erableGovernanceV1 from './erable-governance-v1';
import * as worldLibertyFinancial from './world-liberty-financial-erc20-balance-of-votes';
import * as snxMultichain from './snx-multichain';
import * as moxie from './moxie';
import * as stakingAmountDurationLinear from './staking-amount-duration-linear';
import * as stakingAmountDurationExponential from './staking-amount-duration-exponential';
import * as sacraSubgraph from './sacra-subgraph';
import * as fountainhead from './fountainhead';
import * as naymsStaking from './nayms-staking';
import * as morphoDelegation from './morpho-delegation';
import * as lizcoinStrategy2024 from './lizcoin-strategy-2024';
import * as realt from './realt';
import * as superfluidVesting from './superfluid-vesting';
import * as synapse from './synapse';

const strategies = {
  'delegatexyz-erc721-balance-of': delegatexyzErc721BalanceOf,
  'giveth-balances-supply-weighted': givethBalancesSupplyWeighted,
  'giveth-gnosis-balance-supply-weighted-v3':
    givethGnosisBalanceSupplyWeightedV3,
  'minime-balance-vs-supply-weighted': minimeBalanceVsSupplyWeighted,
  'cap-voting-power': capVotingPower,
  'izumi-veizi': izumiVeiZi,
  'eco-voting-power': ecoVotingPower,
  'eco-multichain-voting-power': ecoMultichainVotingPower,
  'forta-shares': fortaShares,
  'across-staked-acx': acrossStakedAcx,
  'ethermon-erc721': ethermon721,
  'etherorcs-combo-balanceof': etherorcsComboBalanceOf,
  'recusal-list': recusalList,
  'landdao-token-tiers': landDaoTiers,
  'giveth-balancer-balance': givethBalancerBalance,
  'giveth-gnosis-balance-v2': givethGnosisBalanceV2,
  'nouns-rfp-power': nounsPower,
  'anti-whale': antiWhale,
  balancer,
  'balancer-smart-pool': balancerSmartPool,
  'lit-dao-governance': litDaoGovernance,
  'balance-in-vdfyn-vault': vDfynVault,
  'erc20-received': erc20Received,
  'contract-call': contractCall,
  defiplaza: defiplaza,
  'dfyn-staked-in-farms': dfynFarms,
  'dfyn-staked-in-vaults': dfynVaults,
  'dps-nft-strategy': dpsNFTStrategy,
  'dps-nft-strategy-nova': dpsNFTStrategyNova,
  'ens-domains-owned': ensDomainsOwned,
  'ens-reverse-record': ensReverseRecord,
  'ens-10k-club': ens10kClub,
  'ens-all-club-digits': ensAllClubDigits,
  'governor-delegator': governorDelegator,
  'erc20-balance-of': erc20BalanceOf,
  'erc20-balance-of-at': erc20BalanceOfAt,
  'erc20-votes': erc20Votes,
  'erc20-votes-with-override': erc20VotesWithOverride,
  'erc721-multi-registry-weighted': erc721MultiRegistryWeighted,
  'erc20-balance-of-fixed-total': erc20BalanceOfFixedTotal,
  'erc20-balance-of-cv': erc20BalanceOfCv,
  'erc20-balance-of-coeff': erc20BalanceOfCoeff,
  'erc20-with-balance': erc20WithBalance,
  'erc20-balance-of-delegation': erc20BalanceOfDelegation,
  'erc20-balance-of-with-delegation': erc20BalanceOfWithDelegation,
  'erc20-balance-of-quadratic-delegation': erc20BalanceOfQuadraticDelegation,
  'erc20-balance-of-top-holders': erc20BalanceOfTopHolders,
  'erc20-balance-of-weighted': erc20BalanceOfWeighted,
  'erc20-balance-of-indexed': erc20BalanceOfIndexed,
  'erc20-price': erc20Price,
  'ethalend-balance-of': ethalendBalanceOf,
  'balance-of-with-min': balanceOfWithMin,
  'balance-of-with-max': balanceOfWithMax,
  'balance-of-with-thresholds': balanceOfWithThresholds,
  thresholds,
  'eth-balance': ethBalance,
  'eth-with-balance': ethWithBalance,
  'eth-wallet-age': ethWalletAge,
  'maker-ds-chief': makerDsChief,
  erc721,
  'erc721-enumerable': erc721Enumerable,
  'erc721-with-multiplier': erc721WithMultiplier,
  'erc721-with-tokenid': erc721WithTokenId,
  'erc721-with-tokenid-range-weights': erc721WithTokenIdRangeWeights,
  'erc721-with-tokenid-range-weights-simple':
    erc721WithTokenIdRangeWeightsSimple,
  'erc721-with-tokenid-weighted': erc721WithTokenIdWeighted,
  'erc721-with-metadata': erc721WithMetadata,
  'erc721-with-metadata-by-ownerof': erc721WithMetadataByOwnerOf,
  'erc721-multi-registry': erc721MultiRegistry,
  'erc1155-balance-of': erc1155BalanceOf,
  'erc1155-balance-of-cv': erc1155BalanceOfCv,
  'prepo-vesting': prepoVesting,
  multichain,
  'gooddollar-multichain': gooddollarMultichain,
  uni,
  'frax-finance': fraxFinance,
  'frax-finance-fraxtal': fraxFinanceFraxtal,
  'yearn-vault': yearnVault,
  moloch,
  masterchef,
  sushiswap,
  uniswap,
  'faraland-staking': faralandStaking,
  flashstake,
  pancake,
  'pancake-profile': pancakeProfile,
  synthetix,
  'aelin-council': aelinCouncil,
  ctoken,
  'staked-uniswap': stakedUniswap,
  'xdai-easy-staking': xDaiEasyStaking,
  'xdai-posdao-staking': xDaiPOSDAOStaking,
  'xdai-stake-holders': xDaiStakeHolders,
  'xdai-stake-delegation': xDaiStakeDelegation,
  defidollar,
  aavegotchi,
  'aavegotchi-agip': aavegotchiAgip,
  mithcash,
  stablexswap,
  dittomoney,
  'staked-keep': stakedKeep,
  'staked-daomaker': stakedDaomaker,
  'balancer-unipool': balancerUnipool,
  typhoon,
  delegation,
  'delegation-with-cap': delegationWithCap,
  'delegation-with-overrides': delegationWithOverrides,
  'with-delegation': withDelegation,
  ticket,
  work,
  'ticket-validity': ticketValidity,
  validation,
  opium,
  'ocean-marketplace': ocean,
  'the-graph-balance': theGraphBalance,
  'the-graph-delegation': theGraphDelegation,
  'the-graph-indexing': theGraphIndexing,
  whitelist,
  'whitelist-weighted': whitelistWeighted,
  'whitelist-weighted-json': whitelistWeightedJson,
  tokenlon,
  'pob-hash': pobHash,
  'comp-like-votes': compLikeVotes,
  'governor-alpha': governorAlpha,
  pagination,
  'ruler-staked-lp': rulerStakedLP,
  xcover,
  'niu-staked': niuStaked,
  mushrooms: mushrooms,
  'curio-cards-erc20-weighted': curioCardsErc20Weighted,
  'ren-nodes': renNodes,
  'reverse-voting-escrow': reverseVotingEscrow,
  'multisig-owners': multisigOwners,
  'tranche-staking': trancheStaking,
  pepemon,
  'erc1155-all-balances-of': erc1155AllBalancesOf,
  'erc1155-with-multiplier': erc1155WithMultiplier,
  'saffron-finance': saffronFinance,
  'saffron-finance-v2': saffronFinanceV2,
  'tranche-staking-lp': trancheStakingLP,
  'masterchef-pool-balance': masterchefPoolBalance,
  'masterchef-pool-balance-price': masterchefPoolBalancePrice,
  api,
  'api-post': apiPost,
  'api-v2': apiV2,
  'api-v2-override': { ...apiV2 },
  xseen,
  'moloch-all': molochAll,
  'moloch-loot': molochLoot,
  'hopr-uni-lp-farm': hoprUniLpFarm,
  apescape,
  liftkitchen,
  'decentraland-estate-size': decentralandEstateSize,
  'decentraland-wearable-rarity': decentralandWearableRariry,
  'decentraland-rental-lessors': decentralandRentalLessors,
  brightid,
  'inverse-xinv': inverseXINV,
  modefi,
  'iotex-staked-balance': iotexStakedBalance,
  'xrc20-balance-of': xrc20BalanceOf,
  spookyswap,
  glide,
  'rnbw-balance': rnbwBalance,
  'celer-sgn-delegation': celerSgnDelegation,
  'infinityprotocol-liquidity-pools': infinityProtocolPools,
  'aave-governance-power': aaveGovernancePower,
  cake,
  aks,
  ogn,
  oolongswap,
  'impossible-finance': impossibleFinance,
  'zrx-voting-power': zrxVotingPower,
  'tomb-finance': tombFinance,
  'tranche-staking-slice': trancheStakingSLICE,
  'unipool-univ2-lp': unipoolUniv2Lp,
  'unipool-xsushi': unipoolXSushi,
  'taraxa-delegation': taraxaDelegation,
  poap: poap,
  'poap-with-weight': poapWithWeight,
  'poap-with-weight-v2': poapWithWeightV2,
  'uniswap-v3': uniswapV3,
  'uniswap-v3-staking': uniswapV3Staking,
  'l2-deversifi': l2Deversifi,
  'vested-deversifi': vestedDeversifi,
  biswap,
  honeyswap,
  'egl-vote': eglVote,
  'mcn-farm': mcnFarm,
  meebitsdao,
  'crucible-erc20-balance-of': crucibleERC20BalanceOf,
  'erc20-token-and-lp-weighted': erc20TokenAndLpWeighted,
  'erc20-token-and-single-lp-weighted': erc20TokenAndSingleLpWeighted,
  'crucible-erc20-token-and-lp-weighted': crucibleERC20TokenAndLpWeighted,
  'has-rock': hasrock,
  'flexa-capacity-staking': flexaCapacityStaking,
  'sunrisegaming-univ2-lp': sunriseGamingUniv2Lp,
  'sunrisegaming-staking': sunriseGamingStaking,
  'single-staking-autocompound-balanceof': singleStakingAutoCompoundBalanceOf,
  'single-staking-longtermstaking-balanceof':
    singleStakingLongTermStakingBalanceOf,
  'single-staking-pools-balanceof': singleStakingPoolsBalanceOf,
  'hopr-stake-and-balance-qv': hoprStakeAndBalanceQV,
  'hopr-bridged-balance': hoprBridgedBalance,
  'occ-stake-of': occStakeOf,
  'holds-tokens': holdsTokens,
  'loot-character-guilds': lootCharacterGuilds,
  'comp-like-votes-inclusive': compLikeVotesInclusive,
  mstable,
  'hashes-voting': hashesVoting,
  'hashflow-vehft': hashflowVeHft,
  'aavegotchi-wagmi-guild': aavegotchiWagmiGuild,
  'polis-balance': polisBalance,
  'mutant-cats-stakers-and-holders': mutantCatsStakersAndHolders,
  'razor-network-voting': razorVoting,
  'mcb-balance-from-graph': mcbBalanceFromGraph,
  'digitalax-genesis-contribution': digitalaxGenesisContribution,
  'digitalax-lp-stakers': digitalaxLPStakers,
  'digitalax-mona-stakers-matic': digitalaxMonaStakersMatic,
  'digitalax-lp-stakers-matic': digitalaxLPStakersMatic,
  'colony-reputation': colonyReputation,
  'digitalax-mona-quickswap': digitalaxMonaQuickswap,
  'galaxy-nft-with-score': galaxyNftWithScore,
  'galxe-loyalty-points': galxeLoyaltyPoints,
  'galxe-staking': galxeStaking,
  'gatenet-total-staked': gatenetTotalStaked,
  vesper,
  thales,
  'tech-quadratic-ranked-choice': techQuadraticRankedChoice,
  'bsc-mvb': bscMvb,
  coinswap,
  dgenesis,
  'vote-power-and-share': votePowerAndShare,
  math,
  'push-voting-power': pushVotingPower,
  'staked-psp-balance': stakedPSPBalance,
  'erc20-balance-of-contract-multiplier': erc20BalanceOfContractMultiplier,
  juicebox,
  'snet-farmers': snetFarmers,
  'snet-stakers': snetStakers,
  'snet-liquidity-providers': snetLiquidityProviders,
  'unstackedtoadz-and-stackedtoadz-stakers':
    unstackedToadzAndStackedToadzStakers,
  'ocean-dao-brightid': oceanDAOBrightID,
  membership: membership,
  'lydia-gov-vault': lydiaGovVault,
  'darkforest-score': darkforestScore,
  'orange-reputation-based-voting': orangeReputationBasedVoting,
  'orange-reputation-nft-based-voting': orangeReputationNftBasedVoting,
  'squid-dao': squidDao,
  'botto-dao': bottoDao,
  'botto-dao-base': bottoDaoBase,
  genart,
  'path-balance-staked-and-locked': pathBalanceStakedAndLocked,
  'balancer-poolid': balancerPoolid,
  'staked-balancer': stakedBalancer,
  'staked-uniswap-modifiable': stakedUniswapModifiable,
  'erc1155-balance-of-ids': erc1155BalanceOfIds,
  'erc1155-balance-of-ids-weighted': erc1155BalanceOfIdsWeighted,
  'erc1155-weighted-by-id': erc1155weighted,
  'stakers-and-holders': stakersAndHolders,
  'banksy-dao': banksyDao,
  spacey2025: spacey2025,
  'spacefi-blp': spacefiBlp,
  'sandman-dao': sandmanDao,
  've-balance-of-at': veBalanceOfAt,
  've-ribbon': veRibbon,
  've-ribbon-voting-power': veRibbonVotingPower,
  chubbykaijudao: chubbykaijudao,
  revest: revest,
  'staking-claimed-unclaimed': stakingClaimedUnclaimed,
  'gysr-staking-balance': gysrStakingBalance,
  'gysr-lp-staking-balance': gysrLPStakingBalance,
  'wanakafarm-staking': wanakafarmStaking,
  starsharks,
  'printer-financial': printerFinancial,
  'ethercats-founders-series': ethercatsFoundersSeries,
  potion,
  'minotaur-money': MinotaurMoney,
  'conv-finance': convFinance,
  'sd-boost': sdBoost,
  'wanakafarm-land-ingame': wanakafarmLandIngame,
  'starcatchers-top-window': starcatchersTopWindow,
  gno: gno,
  'gno-vote-weight': gno,
  'masterchef-pool-balance-no-rewarddebt': masterchefPoolBalanceNoRewarddebt,
  'proof-of-humanity': proofOfHumanity,
  'sybil-protection': sybilProtection,
  'samurailegends-generals-balance': samuraiLegendsGeneralsBalance,
  'dogs-unchained': dogsUnchained,
  'umami-voting': umamiVoting,
  'liquidity-token-provide': liquidityTokenProvide,
  'gamium-voting': gamiumVoting,
  'citydao-square-root': citydaoSquareRoot,
  'rowdy-roos': rowdyRoos,
  hedgey,
  'hedgey-delegate': hedgeyDelegate,
  've-balance-of-at-nft': veBalanceOfAtNFT,
  'genzees-from-subgraph': genzeesFromSubgraph,
  'position-governance-power': positionGovernancePower,
  'credit-lp': creditLp,
  helix,
  'aura-vault-balance-of-single-asset': auraBalanceOfSingleAsset,
  'rocketpool-node-operator': rocketpoolNodeOperator,
  'rocketpool-node-operator-v2': rocketpoolNodeOperatorv2,
  'rocketpool-node-operator-v3': rocketpoolNodeOperatorv3,
  'rocketpool-node-operator-v4': rocketpoolNodeOperatorv4,
  'rocketpool-node-operator-v7': rocketpoolNodeOperatorv7,
  'rocketpool-node-operator-delegate-v4': rocketpoolNodeOperatorDelegatev4,
  'rocketpool-node-operator-delegate-v5': rocketpoolNodeOperatorDelegatev5,
  'rocketpool-node-operator-delegate-v6': rocketpoolNodeOperatorDelegatev6,
  'rocketpool-node-operator-delegate-v7': rocketpoolNodeOperatorDelegatev7,
  'rocketpool-node-operator-delegate-v8': rocketpoolNodeOperatorDelegatev8,
  'earthfund-child-dao-staking-balance': earthfundChildDaoStakingBalance,
  'sd-boost-twavp': sdBoostTWAVP,
  'unipilot-vault-pilot-balance': unipilotVaultPilotBalance,
  'balance-of-with-linear-vesting-power': balanceOfWithLinearVestingPower,
  'linear-vesting-power': linearVestingPower,
  'lrc-l2-subgraph-balance-of': lrcL2SubgraphBalanceOf,
  'lrc-l2-nft-balance-of': lrcL2NftBalanceOf,
  'lrc-lp-subgraph-balance-of': lrcLPSubgraphBalanceOf,
  'lrc-nft-search-mult': lrcNFTmult,
  'bancor-pool-token-underlying-balance': bancorPoolTokenUnderlyingBalance,
  'balance-of-subgraph': balanceOfSubgraph,
  'wagdie-subgraph': wagdieSubgraph,
  'erc721-pair-weights': erc721PairWeights,
  'harmony-staking': harmonyStaking,
  'erc3525-flexible-voucher': erc3525FlexibleVoucher,
  'orca-pod': orcaPod,
  'metropolis-pod': metropolisPod,
  'proxyprotocol-erc721-balance-of': proxyProtocolErc721BalanceOf,
  'posichain-staking': posichainStaking,
  'posichain-total-balance': posichainTotalBalance,
  'arrow-vesting': arrowVesting,
  'tutellus-protocol': tutellusProtocol,
  'fight-club': fightClub,
  'tpro-staking': tproStaking,
  'safe-vested': safeVested,
  'otterspace-badges': otterspaceBadges,
  'synthetic-nouns-with-claimer': syntheticNounsClaimerOwner,
  'echelon-wallet-prime-and-cached-key': echelonWalletPrimeAndCachedKey,
  'nation3-votes-with-delegations': nation3VotesWIthDelegations,
  'nation3-passport-coop-with-delegations': nation3CoopPassportWithDelegations,
  'erc20-tokens-per-uni': erc20TokensPerUni,
  'bancor-standard-rewards-underlying-balance':
    bancorStandardRewardsUnderlyingBalance,
  'sd-vote-boost': sdVoteBoost,
  'sd-vote-boost-twavp': sdVoteBoostTWAVP,
  spreadsheet,
  'offchain-delegation': offchainDelegation,
  'ninechronicles-staked-and-dcc': ninechroniclesStakedAndDcc,
  'rep3-badges': rep3Badges,
  marsecosystem,
  'ari10-staking-locked': ari10StakingLocked,
  'skale-delegation-weighted': skaleDelegationWeighted,
  reliquary,
  'cookie-staking': cookieStaking,
  'jpegd-locked-jpeg-of': jpegdLockedJpegOf,
  'lodestar-vesting': lodestarVesting,
  'lodestar-staked-lp': lodestarStakedLp,
  'battlefly-vgfly-and-staked-gfly': battleflyVGFLYAndStakedGFLY,
  'nexon-army-nft': nexonArmyNFT,
  'moonbeam-free-balance': moonbeamFreeBalance,
  'stakedotlink-vesting': stakedotlinkVesting,
  'psp-in-sepsp2-balance': pspInSePSP2Balance,
  'pdn-balances-and-vests': pdnBalancesAndVests,
  'lqty-proxy-stakers': lqtyProxyStakers,
  'rdnt-capital-voting': rdntCapitalVoting,
  'staked-defi-balance': stakedDefiBalance,
  'degenzoo-erc721-animals-weighted': degenzooErc721AnimalsWeighted,
  'zunami-pool-gauge-aggregated-balance-of': zunamiPoolGaugeAggregatedBalanceOf,
  'erc721-collateral-held': erc721CollateralHeld,
  'starlay-ve-balance-of-locker-id': starlayVeBalanceOfLockerId,
  'winr-staking': winrStaking,
  spaceid,
  'delegate-registry-v2': delegateRegistryV2,
  'split-delegation': splitDelegation,
  'subgraph-split-delegation': subgraphSplitDelegation,
  'polygon-self-staked-pol': polygonSelfStaked,
  'hats-protocol-single-vote-per-org': hatsProtocolSingleVotePerOrg,
  'karma-discord-roles': karmaDiscordRoles,
  'seedify-cumulative-voting-power-hodl-staking-farming':
    seedifyHoldStakingFarming,
  'staked-morekudasai': stakedMoreKudasai,
  'sablier-v1-deposit': sablierV1Deposit,
  'sablier-v2': sablierV2,
  'gelato-staking': gelatoStaking,
  'erc4626-assets-of': erc4626AssetsOf,
  'friend-tech': friendTech,
  'sd-vote-boost-twavp-v2': sdVoteBoostTWAVPV2,
  'sd-vote-boost-twavp-v3': sdVoteBoostTWAVPV3,
  'sd-vote-boost-twavp-v4': sdVoteBoostTWAVPV4,
  'sd-gauge-less-vote-boost': sdGaugeLessVoteBoost,
  'sd-gauge-less-vote-boost-crosschain': sdGaugeLessVoteBoostCrosschain,
  'sdvote-balanceof-twavp-pool': sdVoteBalanceOfTwavpPool,
  'sd-vote-boost-twavp-vsdtoken': sdVoteBoostTWAVPVsdToken,
  'sd-vote-boost-twavp-vsdcrv-crosschain': sdVoteBoostTWAVPVCrossChain,
  'sd-vote-boost-twavp-balanceof': sdVoteBoostTWAVPBalanceof,
  moonbase: moonbase,
  'dss-vest-unpaid': dssVestUnpaid,
  'dss-vest-balance-and-unpaid': dssVestBalanceAndUnpaid,
  'eoa-balance-and-staking-pools': eoaBalanceAndStakingPools,
  'station-score-if-badge': stationScoreIfBadge,
  'station-constant-if-badge': stationConstantIfBadge,
  'mangrove-station-qv-scaled-to-mgv': mangroveStationQVScaledToMGV,
  floki,
  'hats-protocol-hat-id': hatsProtocolHatId,
  'hats-protocol-hat-ids': hatsProtocolHatIds,
  'bubblegum-kids': bubblegumKids,
  'clipper-staked-sail': clipperStakedSail,
  plearn,
  snote,
  streamr,
  'aavegotchi-agip-17': aavegotchiAgip17,
  'aavegotchi-agip-37-gltr-staked-lp': aavegotchiAgip37GltrStakedLp,
  'aavegotchi-agip-37-wap-ghst': aavegotchiAgip37WapGhst,
  agave,
  'arrakis-finance': arrakisFinance,
  'ctsi-staking-pool': ctsiStakingPool,
  'cyberkongz-v2': cyberkongzV2,
  'dextf-staked-in-vaults': dextfStakedInVaults,
  genomesdao,
  'goldfinch-membership': goldfinchMembership,
  'goldfinch-voting-power': goldfinchVotingPower,
  h2o,
  'hopr-staking-by-season': hoprStakingBySeason,
  'hopr-staking-s2': hoprStakingS2,
  ilv,
  'meebitsdao-delegation': meebitsdaoDelegation,
  'modefi-staking': modefiStaking,
  'orbs-network-delegation': orbsNetworkDelegation,
  'planet-finance-v2': planetFinanceV2,
  'rari-fuse': rariFuse,
  'synthetix-non-quadratic_1': synthetixNonQuadratic_1,
  'synthetix-quadratic': synthetixQuadratic,
  'synthetix-quadratic_1': synthetixQuadratic_1,
  synthetix_1,
  'total-axion-shares': totalAxionShares,
  'unipool-same-token': unipoolSameToken,
  'vendor-v2-borrower-collateral-balance-of':
    vendorV2BorrowerCollateralBalanceOf,
  'volt-voting-power': voltVotingPower,
  'xdai-stakers-and-holders': xdaiStakersAndHolders,
  'urbit-galaxies': urbitGalaxies,
  'vesting-balance-of': vestingBalanceOf,
  'stake-mine-liquid-helios': stakeMineLiquidHelios,
  'pokt-network-pda': poktNetworkPDA,
  'a51-farming': a51Farming,
  'a51-vault-balance': a51VaultBalance,
  'quickswap-v3': quickswapv3,
  'balance-of-with-bazaar-batch-auction-linear-vesting-power':
    balanceOfWithBazaarBatchAuctionLinearVestingPower,
  'staking-balance-of-v1': stakingBalanceOfV1,
  'staking-balance-of-v2': stakingBalanceOfV2,
  'garden-stakes': gardenStakes,
  csv,
  'swarm-staking': swarmStaking,
  'moca-staking': mocaStaking,
  'hats-strategy': hatsStrategy,
  'candy-lockv1-token': candyLockV1Token,
  'candy-lock-token': candyLockToken,
  'candy-auto-vault': candyAutoVault,
  'candy-lock-nft': candyLockNft,
  'candy-nft-staking': candyNftStaking,
  pom,
  superboring,
  'erable-governance-v1': erableGovernanceV1,
  'world-liberty-financial-erc20-balance-of-votes': worldLibertyFinancial,
  'snx-multichain': snxMultichain,
  moxie: moxie,
  'staking-amount-duration-linear': stakingAmountDurationLinear,
  'staking-amount-duration-exponential': stakingAmountDurationExponential,
  'sacra-subgraph': sacraSubgraph,
  fountainhead,
  'nayms-staking': naymsStaking,
  'morpho-delegation': morphoDelegation,
  'lizcoin-strategy-2024': lizcoinStrategy2024,
  realt,
  'superfluid-vesting': superfluidVesting,
  synapse
};

Object.keys(strategies).forEach(function (strategyName) {
  let examples = null;
  let schema = null;
  let about = '';

  try {
    examples = JSON.parse(
      readFileSync(path.join(__dirname, strategyName, 'examples.json'), 'utf8')
    );
  } catch (error) {
    examples = null;
  }

  try {
    schema = JSON.parse(
      readFileSync(path.join(__dirname, strategyName, 'schema.json'), 'utf8')
    );
  } catch (error) {
    schema = null;
  }

  try {
    about = readFileSync(
      path.join(__dirname, strategyName, 'README.md'),
      'utf8'
    );
  } catch (error) {
    about = '';
  }
  strategies[strategyName].examples = examples;
  strategies[strategyName].schema = schema;
  strategies[strategyName].about = about;
});

export default strategies;
