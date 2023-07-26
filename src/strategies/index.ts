import { readFileSync } from 'fs';
import path from 'path';

import * as ecoVotingPower from './eco-voting-power';
import * as dpsNFTStrategy from './dps-nft-strategy';
import * as dpsNFTStrategyNova from './dps-nft-strategy-nova';
import * as nounsPower from './nouns-rfp-power';
import * as erc20Votes from './erc20-votes';
import * as erc20VotesWithOverride from './erc20-votes-with-override';
import * as antiWhale from './anti-whale';
import * as balancer from './balancer';
import * as balancerErc20InternalBalanceOf from './balancer-erc20-internal-balance-of';
import * as sunder from './sunder';
import * as balancerSmartPool from './balancer-smart-pool';
import * as contractCall from './contract-call';
import * as dextfVaults from './dextf-staked-in-vaults';
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
import * as erc20BalanceOfWeighted from './erc20-balance-of-weighted';
import * as ethalendBalanceOf from './ethalend-balance-of';
import * as prepoVesting from './prepo-vesting';
import * as mintoBalanceAll from './minto-balance-of-all';
import * as erc20BalanceOfIndexed from './erc20-balance-of-indexed';
import * as revest from './revest';
import * as erc20Price from './erc20-price';
import * as balanceOfWithMin from './balance-of-with-min';
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
import * as moloch from './moloch';
import * as uniswap from './uniswap';
import * as faralandStaking from './faraland-staking';
import * as flashstake from './flashstake';
import * as pancake from './pancake';
import * as synthetix from './synthetix';
import * as aelinCouncil from './aelin-council';
import * as synthetixQuadratic from './synthetix-quadratic';
import * as synthetixQuadraticOne from './synthetix-quadratic_1';
import * as synthetixQuadraticTwo from './synthetix-quadratic_2';
import * as synthetixOne from './synthetix_1';
import * as synthetixNonQuadratic from './synthetix-non-quadratic';
import * as synthetixNonQuadraticOne from './synthetix-non-quadratic_1';
import * as synthetixNonQuadraticTwo from './synthetix-non-quadratic_2';
import * as ctoken from './ctoken';
import * as cream from './cream';
import * as esd from './esd';
import * as esdDelegation from './esd-delegation';
import * as stakedUniswap from './staked-uniswap';
import * as piedao from './piedao';
import * as ethReceived from './eth-received';
import * as erc20Received from './erc20-received';
import * as ethPhilanthropy from './eth-philanthropy';
import * as xDaiEasyStaking from './xdai-easy-staking';
import * as xDaiPOSDAOStaking from './xdai-posdao-staking';
import * as xDaiStakeHolders from './xdai-stake-holders';
import * as xDaiStakeDelegation from './xdai-stake-delegation';
import * as defidollar from './defidollar';
import * as aavegotchi from './aavegotchi';
import * as aavegotchiAgip from './aavegotchi-agip';
import * as aavegotchiAgip17 from './aavegotchi-agip-17';
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
import * as delegationWithOverrides from './delegation-with-overrides';
import * as withDelegation from './with-delegation';
import * as ticket from './ticket';
import * as work from './work';
import * as ticketValidity from './ticket-validity';
import * as validation from './validation';
import * as opium from './opium';
import * as ocean from './ocean-marketplace';
import * as ocean_v4 from './ocean-marketplace-v4';
import * as theGraphBalance from './the-graph-balance';
import * as theGraphDelegation from './the-graph-delegation';
import * as theGraphIndexing from './the-graph-indexing';
import * as whitelist from './whitelist';
import * as whitelistWeighted from './whitelist-weighted';
import * as tokenlon from './tokenlon';
import * as rebased from './rebased';
import * as pobHash from './pob-hash';
import * as totalAxionShares from './total-axion-shares';
import * as erc1155BalanceOf from './erc1155-balance-of';
import * as erc1155BalanceOfCv from './erc1155-balance-of-cv';
import * as erc1155WithMultiplier from './erc1155-with-multiplier';
import * as compLikeVotes from './comp-like-votes';
import * as governorAlpha from './governor-alpha';
import * as pagination from './pagination';
import * as rulerStakedToken from './ruler-staked-token';
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
import * as avnBalanceOfStaked from './avn-balance-of-staked';
import * as badgeth from './badgeth';
import * as api from './api';
import * as apiPost from './api-post';
import * as apiV2 from './api-v2';
import * as xseen from './xseen';
import * as molochAll from './moloch-all';
import * as molochLoot from './moloch-loot';
import * as erc721Enumerable from './erc721-enumerable';
import * as erc721WithMultiplier from './erc721-with-multiplier';
import * as protofiErc721TierWeighted from './protofi-erc721-tier-weighted';
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
import * as coordinape from './coordinape';
import * as decentralandEstateSize from './decentraland-estate-size';
import * as decentralandWearableRariry from './decentraland-wearable-rarity';
import * as decentralandRentalLessors from './decentraland-rental-lessors';
import * as iotexBalance from './iotex-balance';
import * as iotexStakedBalance from './iotex-staked-balance';
import * as xrc20BalanceOf from './xrc20-balance-of';
import * as brightid from './brightid';
import * as inverseXINV from './inverse-xinv';
import * as modefi from './modefi';
import * as modefiStaking from './modefi-staking';
import * as spookyswap from './spookyswap';
import * as squadzPower from './squadz-power';
import * as glide from './glide';
import * as goldfinchVotingPower from './goldfinch-voting-power';
import * as goldfinchMembership from './goldfinch-membership';
import * as rnbwBalance from './rnbw-balance';
import * as celerSgnDelegation from './celer-sgn-delegation';
import * as balancerDelegation from './balancer-delegation';
import * as infinityProtocolPools from './infinityprotocol-liquidity-pools';
import * as aaveGovernancePower from './aave-governance-power';
import * as cake from './cake';
import * as aks from './aks';
import * as tomyumswap from './tomyumswap';
import * as planetFinance from './planet-finance';
import * as planetFinancev2 from './planet-finance-v2';
import * as impossibleFinance from './impossible-finance';
import * as immutableX from './immutable-x';
import * as ogn from './ogn';
import * as oolongswap from './oolongswap';
import * as zrxVotingPower from './zrx-voting-power';
import * as tombFinance from './tomb-finance';
import * as trancheStakingSLICE from './tranche-staking-slice';
import * as unipoolSameToken from './unipool-same-token';
import * as unipoolUniv2Lp from './unipool-univ2-lp';
import * as unipoolXSushi from './unipool-xsushi';
import * as poap from './poap';
import * as poapWithWeight from './poap-with-weight';
import * as poapWithWeightV2 from './poap-with-weight-v2';
import * as uniswapV3 from './uniswap-v3';
import * as uniswapV3Staking from './uniswap-v3-staking';
import * as l2Deversifi from './l2-deversifi';
import * as vestedDeversifi from './vested-deversifi';
import * as biswap from './biswap';
import * as cronaswap from './cronaswap';
import * as honeyswap from './honeyswap';
import * as eglVote from './egl-vote';
import * as mcnFarm from './mcn-farm';
import * as snowswap from './snowswap';
import * as meebitsdao from './meebitsdao';
import * as membership from './membership';
import * as holdsTokens from './holds-tokens';
import * as crucibleERC20BalanceOf from './crucible-erc20-balance-of';
import * as erc20TokenAndLpWeighted from './erc20-token-and-lp-weighted';
import * as crucibleERC20TokenAndLpWeighted from './crucible-erc20-token-and-lp-weighted';
import * as hasrock from './has-rock';
import * as flexaCapacityStaking from './flexa-capacity-staking';
import * as sunriseGamingUniv2Lp from './sunrisegaming-univ2-lp';
import * as sunriseGamingStaking from './sunrisegaming-staking';
import * as sUmamiHolders from './sumami-holders';
import * as singleStakingAutoCompoundBalanceOf from './single-staking-autocompound-balanceof';
import * as singleStakingPoolsBalanceOf from './single-staking-pools-balanceof';
import * as occStakeOf from './occ-stake-of';
import * as hoprStaking from './hopr-staking';
import * as hoprStakingS2 from './hopr-staking-s2';
import * as hoprStakingBySeason from './hopr-staking-by-season';
import * as hoprBridgedBalance from './hopr-bridged-balance';
import * as hoprStakeAndBalanceQV from './hopr-stake-and-balance-qv';
import * as lootCharacterGuilds from './loot-character-guilds';
import * as swapr from './swapr';
import * as cyberkongz from './cyberkongz';
import * as cyberkongzV2 from './cyberkongz-v2';
import * as cyberkongzV3 from './cyberkongz-v3';
import * as compLikeVotesInclusive from './comp-like-votes-inclusive';
import * as mstable from './mstable';
import * as hashesVoting from './hashes-voting';
import * as hashflowGovernancePower from './hashflow-governance-power';
import * as hashflowVeHft from './hashflow-vehft';
import * as podLeader from './pod-leader';
import * as aavegotchiWagmiGuild from './aavegotchi-wagmi-guild';
import * as polisBalance from './polis-balance';
import * as techQuadraticRankedChoice from './tech-quadratic-ranked-choice';
import * as mutantCatsStakersAndHolders from './mutant-cats-stakers-and-holders';
import * as vaultTokenLpBalance from './vault-token-lp-balance';
import * as singleStakingVaultBalanceOf from './single-staking-vault-balanceof';
import * as razorVoting from './razor-network-voting';
import * as svsStaking from './svs-staking';
import * as mcbBalanceFromGraph from './mcb-balance-from-graph';
import * as colonyReputation from './colony-reputation';
import * as radicleCommunityTokens from './radicle-community-tokens';
import * as digitalaxMonaQuickswap from './digitalax-mona-quickswap';
import * as digitalaxDecoToMona from './digitalax-deco-to-mona';
import * as digitalaxGenesisContribution from './digitalax-genesis-contribution';
import * as digitalaxLPStakers from './digitalax-lp-stakers';
import * as digitalaxMonaStakersMatic from './digitalax-mona-stakers-matic';
import * as digitalaxLPStakersMatic from './digitalax-lp-stakers-matic';
import * as galaxyNftWithScore from './galaxy-nft-with-score';
import * as galxeLoyaltyPoints from './galxe-loyalty-points';
import * as gatenetTotalStaked from './gatenet-total-staked';
import * as vesper from './vesper';
import * as thales from './thales';
import * as bscMvb from './bsc-mvb';
import * as coinswap from './coinswap';
import * as dgenesis from './dgenesis';
import * as votePowerAndShare from './vote-power-and-share';
import * as blockzerolabsCryptonauts from './blockzerolabs-cryptonauts';
import * as math from './math';
import * as pushVotingPower from './push-voting-power';
import * as stakedPSPBalance from './staked-psp-balance';
import * as erc20BalanceOfContractMultiplier from './erc20-balance-of-contract-multiplier';
import * as agave from './agave';
import * as juicebox from './juicebox';
import * as snetFarmers from './snet-farmers';
import * as snetStakers from './snet-stakers';
import * as snetLiquidityProviders from './snet-liquidity-providers';
import * as minMaxMcnFarm from './minmax-mcn-farm';
import * as unstackedToadzAndStackedToadzStakers from './unstackedtoadz-and-stackedtoadz-stakers';
import * as jadeSmrt from './jade-smrt';
import * as oceanDAOBrightID from './ocean-dao-brightid';
import * as saddleFinance from './saddle-finance';
import * as saddleFinanceV2 from './saddle-finance-v2';
import * as lydiaGovVault from './lydia-gov-vault';
import * as xkawaFarm from './xkawa-farm';
import * as darkforestScore from './darkforest-score';
import * as orangeReputationBasedVoting from './orange-reputation-based-voting';
import * as orangeReputationNftBasedVoting from './orange-reputation-nft-based-voting';
import * as squidDao from './squid-dao';
import * as pathBalanceStakedAndLocked from './path-balance-staked-and-locked';
import * as bottoDao from './botto-dao';
import * as genart from './genart';
import * as erc721MultiRegistryWeighted from './erc721-multi-registry-weighted';
import * as genomesdao from './genomesdao';
import * as zorro from './zorro';
import * as voltVotingPower from './volt-voting-power';
import * as balancerPoolid from './balancer-poolid';
import * as stakedBalancer from './staked-balancer';
import * as stakedUniswapModifiable from './staked-uniswap-modifiable';
import * as givethXdaiBalance from './giveth-xdai-balance';
import * as givethGnosisBalanceV2 from './giveth-gnosis-balance-v2';
import * as givethBalancerBalance from './giveth-balancer-balance';
import * as erc1155BalanceOfIds from './erc1155-balance-of-ids';
import * as erc1155BalanceOfIdsWeighted from './erc1155-balance-of-ids-weighted';
import * as erc1155weighted from './erc1155-weighted-by-id';
import * as stakersAndHolders from './stakers-and-holders';
import * as banksyDao from './banksy-dao';
import * as spacey2025 from './spacey2025';
import * as sandmanDao from './sandman-dao';
import * as ethercatsFounderSeries from './ethercats-founder-series';
import * as veBalanceOfAt from './ve-balance-of-at';
import * as veRibbon from './ve-ribbon';
import * as veRibbonVotingPower from './ve-ribbon-voting-power';
import * as chubbykaijudao from './chubbykaijudao';
import * as landDaoTiers from './landdao-token-tiers';
import * as defiplaza from './defiplaza';
import * as stakingClaimedUnclaimed from './staking-claimed-unclaimed';
import * as gysrStakingBalance from './gysr-staking-balance';
import * as gysrPendingRewards from './gysr-pending-rewards';
import * as gysrLPStakingBalance from './gysr-lp-staking-balance';
import * as wanakafarmStaking from './wanakafarm-staking';
import * as starsharks from './starsharks';
import * as printerFinancial from './printer-financial';
import * as ethercatsFoundersSeries from './ethercats-founders-series';
import * as potion from './potion';
import * as MinotaurMoney from './minotaur-money';
import * as safetyModuleBptPower from './safety-module-bpt-power';
import * as convFinance from './conv-finance';
import * as sdBoost from './sd-boost';
import * as capitalDaoStaking from './capitaldao-staking';
import * as erc20RebaseWrapper from './erc20-rebase-wrapper';
import * as wanakafarmLandIngame from './wanakafarm-land-ingame';
import * as meebitsDaoDelegation from './meebitsdao-delegation';
import * as starcatchersTopWindow from './starcatchers-top-window';
import * as gno from './gno';
import * as umaVoting from './uma-voting';
import * as masterchefPoolBalanceNoRewarddebt from './masterchef-pool-balance-no-rewarddebt';
import * as proofOfHumanity from './proof-of-humanity';
import * as samuraiLegendsGeneralsBalance from './samurailegends-generals-balance';
import * as dogsUnchained from './dogs-unchained';
import * as stakeDAOGovernanceUpdate from './stakedao-governance-update';
import * as umamiVoting from './umami-voting';
import * as liquidityTokenProvide from './liquidity-token-provide';
import * as gamiumVoting from './gamium-voting';
import * as citydaoSquareRoot from './citydao-square-root';
import * as recusalList from './recusal-list';
import * as rowdyRoos from './rowdy-roos';
import * as ethermon721 from './ethermon-erc721';
import * as etherorcsComboBalanceOf from './etherorcs-combo-balanceof';
import * as hedgey from './hedgey';
import * as hedgeyMulti from './hedgey-multi';
import * as hedgeyDelegate from './hedgey-delegate';
import * as sybilProtection from './sybil-protection';
import * as veBalanceOfAtNFT from './ve-balance-of-at-nft';
import * as genzeesFromSubgraph from './genzees-from-subgraph';
import * as ginFinance from './gin-finance';
import * as positionGovernancePower from './position-governance-power';
import * as creditLp from './credit-lp';
import * as helix from './helix';
import * as arrakisFinance from './arrakis-finance';
import * as auraFinance from './aura-vlaura-vebal';
import * as auraFinanceWithOverrides from './aura-vlaura-vebal-with-overrides';
import * as auraBalanceOfVlauraVebal from './aura-balance-of-vlaura-vebal';
import * as auraBalanceOfSingleAsset from './aura-vault-balance-of-single-asset';
import * as rocketpoolNodeOperator from './rocketpool-node-operator';
import * as rocketpoolNodeOperatorv2 from './rocketpool-node-operator-v2';
import * as earthfundChildDaoStakingBalance from './earthfund-child-dao-staking-balance';
import * as unipilotVaultPilotBalance from './unipilot-vault-pilot-balance';
import * as sdBoostTWAVP from './sd-boost-twavp';
import * as apeswap from './apeswap';
import * as fortaShares from './forta-shares';
import * as solvVoucherClaimable from './solv-voucher-claimable';
import * as h2o from './h2o';
import * as dopamine from './dopamine';
import * as lrcL2SubgraphBalanceOf from './lrc-l2-subgraph-balance-of';
import * as lrcL2NftBalanceOf from './lrc-l2-nft-balance-of';
import * as lrcLPSubgraphBalanceOf from './lrc-lp-subgraph-balance-of';
import * as lrcNFTDAOSearch from './lrc-nft-dao-search';
import * as lrcNFTmult from './lrc-nft-search-mult';
import * as erc3525VestingVoucher from './erc3525-vesting-voucher';
import * as rariFuse from './rari-fuse';
import * as selfswap from './selfswap';
import * as xrookBalanceOfUnderlyingWeighted from './xrook-balance-of-underlying-weighted';
import * as bancorPoolTokenUnderlyingBalance from './bancor-pool-token-underlying-balance';
import * as orbsNetworkDelegation from './orbs-network-delegation';
import * as balanceOfSubgraph from './balance-of-subgraph';
import * as wagdieSubgraph from './wagdie-subgraph';
import * as erc3525FlexibleVoucher from './erc3525-flexible-voucher';
import * as erc721PairWeights from './erc721-pair-weights';
import * as harmonyStaking from './harmony-staking';
import * as echelonCachedErc1155Decay from './echelon-cached-erc1155-decay';
import * as orcaPod from './orca-pod';
import * as metropolisPod from './metropolis-pod';
import * as proxyProtocolErc20BalanceOf from './proxyprotocol-erc20-balance-of';
import * as proxyProtocolErc721BalanceOf from './proxyprotocol-erc721-balance-of';
import * as proxyProtocolErc1155BalanceOf from './proxyprotocol-erc1155-balance-of';
import * as arrowVesting from './arrow-vesting';
import * as tutellusProtocol from './tutellus-protocol';
import * as fightClub from './fight-club';
import * as tproStaking from './tpro-staking';
import * as safeVested from './safe-vested';
import * as riskharborUnderwriter from './riskharbor-underwriter';
import * as otterspaceBadges from './otterspace-badges';
import * as syntheticNounsClaimerOwner from './synthetic-nouns-with-claimer';
import * as depositInSablierStream from './deposit-in-sablier-stream';
import * as echelonWalletPrimeAndCachedKey from './echelon-wallet-prime-and-cached-key';
import * as nation3VotesWIthDelegations from './nation3-votes-with-delegations';
import * as nation3CoopPassportWithDelegations from './nation3-passport-coop-with-delegations'
import * as aavegotchiAgip37WapGhst from './aavegotchi-agip-37-wap-ghst';
import * as aavegotchiAgip37GltrStakedLp from './aavegotchi-agip-37-gltr-staked-lp';
import * as posichainStaking from './posichain-staking';
import * as posichainTotalBalance from './posichain-total-balance';
import * as erc20TokensPerUni from './erc20-tokens-per-uni';
import * as bancorStandardRewardsUnderlyingBalance from './bancor-standard-rewards-underlying-balance';
import * as sdVoteBoost from './sd-vote-boost';
import * as sdVoteBoostTWAVP from './sd-vote-boost-twavp';
import * as clqdrBalanceWithLp from './clqdr-balance-with-lp';
import * as ninechroniclesStakedAndDcc from './ninechronicles-staked-and-dcc';
import * as spreadsheet from './spreadsheet';
import * as offchainDelegation from './offchain-delegation';
import * as dslaParametricStakingServiceCredits from './dsla-parametric-staking-service-credits';
import * as rep3Badges from './rep3-badges';
import * as marsecosystem from './marsecosystem';
import * as ari10StakingLocked from './ari10-staking-locked';
import * as multichainSerie from './multichain-serie';
import * as ctsiStaking from './ctsi-staking';
import * as ctsiStakingPool from './ctsi-staking-pool';
import * as skaleDelegationWeighted from './skale-delegation-weighted';
import * as reliquary from './reliquary';
import * as acrossStakedAcx from './across-staked-acx';
import * as vstaPoolStaking from './vsta-pool-staking';
import * as lodestarVesting from './lodestar-vesting';
import * as lodestarStakedLp from './lodestar-staked-lp';
import * as jpegdLockedJpegOf from './jpegd-locked-jpeg-of';
import * as litDaoGovernance from './lit-dao-governance';
import * as babywealthyclub from './babywealthyclub';
import * as battleflyVGFLYAndStakedGFLY from './battlefly-vgfly-and-staked-gfly';
import * as nexonArmyNFT from './nexon-army-nft';
import * as moonbeamFreeBalance from './moonbeam-free-balance';
import * as stakedotlinkVesting from './stakedotlink-vesting';
import * as pspInSePSP2Balance from './psp-in-sepsp2-balance';
import * as pdnBalancesAndVests from './pdn-balances-and-vests';
import * as izumiVeiZi from './izumi-veizi';
import * as lqtyProxyStakers from './lqty-proxy-stakers';
import * as echelonWalletPrimeAndCachedKeyGated from './echelon-wallet-prime-and-cached-key-gated';
import * as rdntCapitalVoting from './rdnt-capital-voting';
import * as stakedDefiBalance from './staked-defi-balance';
import * as degenzooErc721AnimalsWeighted from './degenzoo-erc721-animals-weighted';
import * as capVotingPower from './cap-voting-power';
import * as zunamiPoolGaugeAggregatedBalanceOf from './zunami-pool-gauge-aggregated-balance-of';
import * as erc721CollateralHeld from './erc721-collateral-held';
import * as starlayVeBalanceOfLockerId from './starlay-ve-balance-of-locker-id';
import * as winrStaking from './winr-staking';
import * as spaceid from './spaceid';
import * as hatsProtocolSingleVotePerOrg from './hats-protocol-single-vote-per-org';
import * as karmaDiscordRoles from './karma-discord-roles';
import * as seedifyHoldStakingFarming from './seedify-cumulative-voting-power-hodl-staking-farming';
import * as stakedMoreKudasai from './staked-morekudasai';

const strategies = {
  'cap-voting-power': capVotingPower,
  'izumi-veizi': izumiVeiZi,
  'eco-voting-power': ecoVotingPower,
  'forta-shares': fortaShares,
  'across-staked-acx': acrossStakedAcx,
  'ethermon-erc721': ethermon721,
  'etherorcs-combo-balanceof': etherorcsComboBalanceOf,
  'recusal-list': recusalList,
  'landdao-token-tiers': landDaoTiers,
  'giveth-balancer-balance': givethBalancerBalance,
  'giveth-xdai-balance': givethXdaiBalance,
  'giveth-gnosis-balance-v2': givethGnosisBalanceV2,
  'nouns-rfp-power': nounsPower,
  coordinape,
  'anti-whale': antiWhale,
  balancer,
  sunder,
  'balancer-smart-pool': balancerSmartPool,
  'lit-dao-governance': litDaoGovernance,
  'balancer-erc20-internal-balance-of': balancerErc20InternalBalanceOf,
  'balance-in-vdfyn-vault': vDfynVault,
  'erc20-received': erc20Received,
  'contract-call': contractCall,
  defiplaza: defiplaza,
  'dextf-staked-in-vaults': dextfVaults,
  'dfyn-staked-in-farms': dfynFarms,
  'dfyn-staked-in-vaults': dfynVaults,
  'dps-nft-strategy': dpsNFTStrategy,
  'dps-nft-strategy-nova': dpsNFTStrategyNova,
  'eth-received': ethReceived,
  'eth-philanthropy': ethPhilanthropy,
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
  'erc20-balance-of-weighted': erc20BalanceOfWeighted,
  'minto-balance-of-all': mintoBalanceAll,
  'erc20-balance-of-indexed': erc20BalanceOfIndexed,
  'erc20-price': erc20Price,
  'ethalend-balance-of': ethalendBalanceOf,
  'balance-of-with-min': balanceOfWithMin,
  'balance-of-with-thresholds': balanceOfWithThresholds,
  thresholds,
  'eth-balance': ethBalance,
  'eth-with-balance': ethWithBalance,
  'eth-wallet-age': ethWalletAge,
  'maker-ds-chief': makerDsChief,
  erc721,
  'erc721-enumerable': erc721Enumerable,
  'erc721-with-multiplier': erc721WithMultiplier,
  'protofi-erc721-tier-weighted': protofiErc721TierWeighted,
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
  'yearn-vault': yearnVault,
  moloch,
  masterchef,
  sushiswap,
  uniswap,
  'faraland-staking': faralandStaking,
  flashstake,
  pancake,
  synthetix,
  'aelin-council': aelinCouncil,
  'synthetix-quadratic': synthetixQuadratic,
  'synthetix-quadratic_1': synthetixQuadraticOne,
  'synthetix-quadratic_2': synthetixQuadraticTwo,
  synthetix_1: synthetixOne,
  'synthetix-non-quadratic': synthetixNonQuadratic,
  'synthetix-non-quadratic_1': synthetixNonQuadraticOne,
  'synthetix-non-quadratic_2': synthetixNonQuadraticTwo,
  ctoken,
  cream,
  'staked-uniswap': stakedUniswap,
  esd,
  'esd-delegation': esdDelegation,
  piedao,
  'xdai-easy-staking': xDaiEasyStaking,
  'xdai-posdao-staking': xDaiPOSDAOStaking,
  'xdai-stake-holders': xDaiStakeHolders,
  'xdai-stake-delegation': xDaiStakeDelegation,
  defidollar,
  aavegotchi,
  'aavegotchi-agip': aavegotchiAgip,
  'aavegotchi-agip-17': aavegotchiAgip17,
  mithcash,
  stablexswap,
  dittomoney,
  'staked-keep': stakedKeep,
  'staked-daomaker': stakedDaomaker,
  'balancer-unipool': balancerUnipool,
  typhoon,
  delegation,
  'delegation-with-overrides': delegationWithOverrides,
  'with-delegation': withDelegation,
  ticket,
  work,
  'ticket-validity': ticketValidity,
  validation,
  opium,
  'ocean-marketplace': ocean,
  'ocean-marketplace-v4': ocean_v4,
  'the-graph-balance': theGraphBalance,
  'the-graph-delegation': theGraphDelegation,
  'the-graph-indexing': theGraphIndexing,
  whitelist,
  'whitelist-weighted': whitelistWeighted,
  tokenlon,
  rebased,
  'pob-hash': pobHash,
  'total-axion-shares': totalAxionShares,
  'comp-like-votes': compLikeVotes,
  'governor-alpha': governorAlpha,
  pagination,
  'ruler-staked-token': rulerStakedToken,
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
  'avn-balance-of-staked': avnBalanceOfStaked,
  api,
  'api-post': apiPost,
  'api-v2': apiV2,
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
  'modefi-staking': modefiStaking,
  'iotex-balance': iotexBalance,
  'iotex-staked-balance': iotexStakedBalance,
  'xrc20-balance-of': xrc20BalanceOf,
  spookyswap,
  'squadz-power': squadzPower,
  glide,
  'goldfinch-voting-power': goldfinchVotingPower,
  'goldfinch-membership': goldfinchMembership,
  'rnbw-balance': rnbwBalance,
  'celer-sgn-delegation': celerSgnDelegation,
  'balancer-delegation': balancerDelegation,
  'infinityprotocol-liquidity-pools': infinityProtocolPools,
  'aave-governance-power': aaveGovernancePower,
  cake,
  aks,
  tomyumswap,
  'planet-finance': planetFinance,
  'planet-finance-v2': planetFinancev2,
  ogn,
  oolongswap,
  'impossible-finance': impossibleFinance,
  'immutable-x': immutableX,
  badgeth,
  'zrx-voting-power': zrxVotingPower,
  'tomb-finance': tombFinance,
  'tranche-staking-slice': trancheStakingSLICE,
  'unipool-same-token': unipoolSameToken,
  'unipool-univ2-lp': unipoolUniv2Lp,
  'unipool-xsushi': unipoolXSushi,
  poap: poap,
  'poap-with-weight': poapWithWeight,
  'poap-with-weight-v2': poapWithWeightV2,
  'uniswap-v3': uniswapV3,
  'uniswap-v3-staking': uniswapV3Staking,
  'l2-deversifi': l2Deversifi,
  'vested-deversifi': vestedDeversifi,
  biswap,
  cronaswap,
  honeyswap,
  'egl-vote': eglVote,
  'mcn-farm': mcnFarm,
  snowswap,
  meebitsdao,
  'crucible-erc20-balance-of': crucibleERC20BalanceOf,
  'erc20-token-and-lp-weighted': erc20TokenAndLpWeighted,
  'crucible-erc20-token-and-lp-weighted': crucibleERC20TokenAndLpWeighted,
  'has-rock': hasrock,
  'flexa-capacity-staking': flexaCapacityStaking,
  'sunrisegaming-univ2-lp': sunriseGamingUniv2Lp,
  'sunrisegaming-staking': sunriseGamingStaking,
  'single-staking-autocompound-balanceof': singleStakingAutoCompoundBalanceOf,
  'single-staking-pools-balanceof': singleStakingPoolsBalanceOf,
  'hopr-staking': hoprStaking,
  'hopr-staking-s2': hoprStakingS2,
  'hopr-staking-by-season': hoprStakingBySeason,
  'hopr-stake-and-balance-qv': hoprStakeAndBalanceQV,
  'hopr-bridged-balance': hoprBridgedBalance,
  'occ-stake-of': occStakeOf,
  swapr,
  'holds-tokens': holdsTokens,
  'loot-character-guilds': lootCharacterGuilds,
  cyberkongz: cyberkongz,
  'cyberkongz-v2': cyberkongzV2,
  'cyberkongz-v3': cyberkongzV3,
  'comp-like-votes-inclusive': compLikeVotesInclusive,
  mstable,
  'hashes-voting': hashesVoting,
  'hashflow-governance-power': hashflowGovernancePower,
  'hashflow-vehft': hashflowVeHft,
  'pod-leader': podLeader,
  'aavegotchi-wagmi-guild': aavegotchiWagmiGuild,
  'polis-balance': polisBalance,
  'vault-token-lp-balance': vaultTokenLpBalance,
  'single-staking-vault-balanceof': singleStakingVaultBalanceOf,
  'mutant-cats-stakers-and-holders': mutantCatsStakersAndHolders,
  'razor-network-voting': razorVoting,
  'svs-staking': svsStaking,
  'mcb-balance-from-graph': mcbBalanceFromGraph,
  'radicle-community-tokens': radicleCommunityTokens,
  'digitalax-mona-quickswap': digitalaxMonaQuickswap,
  'digitalax-deco-to-mona': digitalaxDecoToMona,
  'digitalax-genesis-contribution': digitalaxGenesisContribution,
  'digitalax-lp-stakers': digitalaxLPStakers,
  'digitalax-mona-stakers-matic': digitalaxMonaStakersMatic,
  'digitalax-lp-stakers-matic': digitalaxLPStakersMatic,
  'colony-reputation': colonyReputation,
  'galaxy-nft-with-score': galaxyNftWithScore,
  'galxe-loyalty-points': galxeLoyaltyPoints,
  'gatenet-total-staked': gatenetTotalStaked,
  vesper,
  thales,
  'tech-quadratic-ranked-choice': techQuadraticRankedChoice,
  'bsc-mvb': bscMvb,
  coinswap,
  dgenesis,
  'vote-power-and-share': votePowerAndShare,
  'blockzerolabs-cryptonauts': blockzerolabsCryptonauts,
  math,
  'push-voting-power': pushVotingPower,
  'staked-psp-balance': stakedPSPBalance,
  'erc20-balance-of-contract-multiplier': erc20BalanceOfContractMultiplier,
  agave,
  juicebox,
  'snet-farmers': snetFarmers,
  'snet-stakers': snetStakers,
  'snet-liquidity-providers': snetLiquidityProviders,
  'minmax-mcn-farm': minMaxMcnFarm,
  'unstackedtoadz-and-stackedtoadz-stakers':
    unstackedToadzAndStackedToadzStakers,
  'jade-smrt': jadeSmrt,
  'ocean-dao-brightid': oceanDAOBrightID,
  'saddle-finance': saddleFinance,
  'saddle-finance-v2': saddleFinanceV2,
  membership: membership,
  'lydia-gov-vault': lydiaGovVault,
  'xkawa-farm': xkawaFarm,
  'darkforest-score': darkforestScore,
  'orange-reputation-based-voting': orangeReputationBasedVoting,
  'orange-reputation-nft-based-voting': orangeReputationNftBasedVoting,
  'squid-dao': squidDao,
  'botto-dao': bottoDao,
  genart,
  genomesdao,
  'path-balance-staked-and-locked': pathBalanceStakedAndLocked,
  'sumami-holders': sUmamiHolders,
  zorro,
  'volt-voting-power': voltVotingPower,
  'balancer-poolid': balancerPoolid,
  'staked-balancer': stakedBalancer,
  'staked-uniswap-modifiable': stakedUniswapModifiable,
  'erc1155-balance-of-ids': erc1155BalanceOfIds,
  'erc1155-balance-of-ids-weighted': erc1155BalanceOfIdsWeighted,
  'erc1155-weighted-by-id': erc1155weighted,
  'stakers-and-holders': stakersAndHolders,
  'banksy-dao': banksyDao,
  spacey2025: spacey2025,
  'sandman-dao': sandmanDao,
  'ethercats-founder-series': ethercatsFounderSeries,
  've-balance-of-at': veBalanceOfAt,
  've-ribbon': veRibbon,
  've-ribbon-voting-power': veRibbonVotingPower,
  chubbykaijudao: chubbykaijudao,
  revest: revest,
  'staking-claimed-unclaimed': stakingClaimedUnclaimed,
  'gysr-staking-balance': gysrStakingBalance,
  'gysr-pending-rewards': gysrPendingRewards,
  'gysr-lp-staking-balance': gysrLPStakingBalance,
  'wanakafarm-staking': wanakafarmStaking,
  starsharks,
  'printer-financial': printerFinancial,
  'ethercats-founders-series': ethercatsFoundersSeries,
  potion,
  'safety-module-bpt-power': safetyModuleBptPower,
  'minotaur-money': MinotaurMoney,
  'conv-finance': convFinance,
  'sd-boost': sdBoost,
  'capitaldao-staking': capitalDaoStaking,
  'erc20-rebase-wrapper': erc20RebaseWrapper,
  'wanakafarm-land-ingame': wanakafarmLandIngame,
  'meebitsdao-delegation': meebitsDaoDelegation,
  'starcatchers-top-window': starcatchersTopWindow,
  gno: gno,
  'gno-vote-weight': gno,
  'uma-voting': umaVoting,
  'masterchef-pool-balance-no-rewarddebt': masterchefPoolBalanceNoRewarddebt,
  'proof-of-humanity': proofOfHumanity,
  'sybil-protection': sybilProtection,
  'samurailegends-generals-balance': samuraiLegendsGeneralsBalance,
  'dogs-unchained': dogsUnchained,
  'stakedao-governance-update': stakeDAOGovernanceUpdate,
  'umami-voting': umamiVoting,
  'liquidity-token-provide': liquidityTokenProvide,
  'gamium-voting': gamiumVoting,
  'citydao-square-root': citydaoSquareRoot,
  'rowdy-roos': rowdyRoos,
  hedgey,
  'hedgey-multi': hedgeyMulti,
  'hedgey-delegate': hedgeyDelegate,
  've-balance-of-at-nft': veBalanceOfAtNFT,
  'genzees-from-subgraph': genzeesFromSubgraph,
  'gin-finance': ginFinance,
  'position-governance-power': positionGovernancePower,
  'credit-lp': creditLp,
  helix,
  'arrakis-finance': arrakisFinance,
  'aura-vlaura-vebal': auraFinance,
  'aura-vlaura-vebal-with-overrides': auraFinanceWithOverrides,
  'aura-balance-of-vlaura-vebal': auraBalanceOfVlauraVebal,
  'aura-vault-balance-of-single-asset': auraBalanceOfSingleAsset,
  'rocketpool-node-operator': rocketpoolNodeOperator,
  'rocketpool-node-operator-v2': rocketpoolNodeOperatorv2,
  'earthfund-child-dao-staking-balance': earthfundChildDaoStakingBalance,
  'sd-boost-twavp': sdBoostTWAVP,
  'unipilot-vault-pilot-balance': unipilotVaultPilotBalance,
  'solv-voucher-claimable': solvVoucherClaimable,
  'balance-of-with-linear-vesting-power': balanceOfWithLinearVestingPower,
  'linear-vesting-power': linearVestingPower,
  apeswap,
  h2o,
  dopamine,
  'lrc-l2-subgraph-balance-of': lrcL2SubgraphBalanceOf,
  'lrc-l2-nft-balance-of': lrcL2NftBalanceOf,
  'lrc-lp-subgraph-balance-of': lrcLPSubgraphBalanceOf,
  'lrc-nft-dao-search': lrcNFTDAOSearch,
  'lrc-nft-search-mult': lrcNFTmult,
  'rari-fuse': rariFuse,
  'bancor-pool-token-underlying-balance': bancorPoolTokenUnderlyingBalance,
  selfswap,
  'erc3525-vesting-voucher': erc3525VestingVoucher,
  'xrook-balance-of-underlying-weighted': xrookBalanceOfUnderlyingWeighted,
  'orbs-network-delegation': orbsNetworkDelegation,
  'balance-of-subgraph': balanceOfSubgraph,
  'wagdie-subgraph': wagdieSubgraph,
  'erc721-pair-weights': erc721PairWeights,
  'harmony-staking': harmonyStaking,
  'echelon-cached-erc1155-decay': echelonCachedErc1155Decay,
  'erc3525-flexible-voucher': erc3525FlexibleVoucher,
  'orca-pod': orcaPod,
  'metropolis-pod': metropolisPod,
  'proxyprotocol-erc20-balance-of': proxyProtocolErc20BalanceOf,
  'proxyprotocol-erc721-balance-of': proxyProtocolErc721BalanceOf,
  'proxyprotocol-erc1155-balance-of': proxyProtocolErc1155BalanceOf,
  'posichain-staking': posichainStaking,
  'posichain-total-balance': posichainTotalBalance,
  'arrow-vesting': arrowVesting,
  'tutellus-protocol': tutellusProtocol,
  'fight-club': fightClub,
  'tpro-staking': tproStaking,
  'safe-vested': safeVested,
  'riskharbor-underwriter': riskharborUnderwriter,
  'otterspace-badges': otterspaceBadges,
  'synthetic-nouns-with-claimer': syntheticNounsClaimerOwner,
  'deposit-in-sablier-stream': depositInSablierStream,
  'echelon-wallet-prime-and-cached-key': echelonWalletPrimeAndCachedKey,
  'nation3-votes-with-delegations': nation3VotesWIthDelegations,
  'nation3-passport-coop-with-delegations':nation3CoopPassportWithDelegations,
  'aavegotchi-agip-37-wap-ghst': aavegotchiAgip37WapGhst,
  'aavegotchi-agip-37-gltr-staked-lp': aavegotchiAgip37GltrStakedLp,
  'erc20-tokens-per-uni': erc20TokensPerUni,
  'bancor-standard-rewards-underlying-balance':
    bancorStandardRewardsUnderlyingBalance,
  'sd-vote-boost': sdVoteBoost,
  'sd-vote-boost-twavp': sdVoteBoostTWAVP,
  'clqdr-balance-with-lp': clqdrBalanceWithLp,
  spreadsheet,
  'offchain-delegation': offchainDelegation,
  'ninechronicles-staked-and-dcc': ninechroniclesStakedAndDcc,
  'dsla-parametric-staking-service-credits':
    dslaParametricStakingServiceCredits,
  'rep3-badges': rep3Badges,
  marsecosystem,
  'ari10-staking-locked': ari10StakingLocked,
  'multichain-serie': multichainSerie,
  'ctsi-staking': ctsiStaking,
  'ctsi-staking-pool': ctsiStakingPool,
  'skale-delegation-weighted': skaleDelegationWeighted,
  reliquary,
  'vsta-pool-staking': vstaPoolStaking,
  'jpegd-locked-jpeg-of': jpegdLockedJpegOf,
  'lodestar-vesting': lodestarVesting,
  'lodestar-staked-lp': lodestarStakedLp,
  babywealthyclub,
  'battlefly-vgfly-and-staked-gfly': battleflyVGFLYAndStakedGFLY,
  'nexon-army-nft': nexonArmyNFT,
  'moonbeam-free-balance': moonbeamFreeBalance,
  'stakedotlink-vesting': stakedotlinkVesting,
  'psp-in-sepsp2-balance': pspInSePSP2Balance,
  'pdn-balances-and-vests': pdnBalancesAndVests,
  'lqty-proxy-stakers': lqtyProxyStakers,
  'echelon-wallet-prime-and-cached-key-gated':
    echelonWalletPrimeAndCachedKeyGated,
  'rdnt-capital-voting': rdntCapitalVoting,
  'staked-defi-balance': stakedDefiBalance,
  'degenzoo-erc721-animals-weighted': degenzooErc721AnimalsWeighted,
  'zunami-pool-gauge-aggregated-balance-of': zunamiPoolGaugeAggregatedBalanceOf,
  'erc721-collateral-held': erc721CollateralHeld,
  'starlay-ve-balance-of-locker-id': starlayVeBalanceOfLockerId,
  'winr-staking': winrStaking,
  spaceid,
  'hats-protocol-single-vote-per-org': hatsProtocolSingleVotePerOrg,
  'karma-discord-roles': karmaDiscordRoles,
  'seedify-cumulative-voting-power-hodl-staking-farming':
    seedifyHoldStakingFarming,
  'staked-morekudasai': stakedMoreKudasai
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
