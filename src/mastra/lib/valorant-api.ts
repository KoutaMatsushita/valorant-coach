import { z } from "zod";

const API_BASE_URL = "https://api.henrikdev.xyz";
const API_KEY = process.env.VALORANT_API_KEY;

export async function fetchValorantApi(endpoint: string) {
	if (!API_KEY) {
		throw new Error("VALORANT_API_KEY environment variable is not set.");
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		headers: {
			Authorization: API_KEY,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`API request failed with status ${response.status}: ${errorText}`,
		);
	}

	const data = await response.json();
	if (data.status && data.status !== 200) {
		throw new Error(`API returned an error: ${JSON.stringify(data.errors)}`);
	}

	return data.data ?? data;
}

export const PlatformSchema = z.enum(["pc", "console"]).default("pc");
export const ModeSchema = z
	.enum([
		"competitive",
		"custom",
		"deathmatch",
		"ggteam",
		"hurm",
		"newmap",
		"onefa",
		"snowball",
		"spikerush",
		"swiftplay",
		"unrated",
	])
	.default("competitive");
export const RegionSchema = z.enum(["eu", "na", "ap", "kr"]).default("ap");
export const TiersEnum = z.enum([
	"Unrated",
	"Unknown 1",
	"Unknown 2",
	"Iron 1",
	"Iron 2",
	"Iron 3",
	"Bronze 1",
	"Bronze 2",
	"Bronze 3",
	"Silver 1",
	"Silver 2",
	"Silver 3",
	"Gold 1",
	"Gold 2",
	"Gold 3",
	"Platinum 1",
	"Platinum 2",
	"Platinum 3",
	"Diamond 1",
	"Diamond 2",
	"Diamond 3",
	"Ascendant 1",
	"Ascendant 2",
	"Ascendant 3",
	"Immortal 1",
	"Immortal 2",
	"Immortal 3",
	"Radiant",
]);

export const SeasonsEnum = z.enum([
	"e1a1",
	"e1a2",
	"e1a3",
	"e2a1",
	"e2a2",
	"e2a3",
	"e3a1",
	"e3a2",
	"e3a3",
	"e4a1",
	"e4a2",
	"e4a3",
	"e5a1",
	"e5a2",
	"e5a3",
	"e6a1",
	"e6a2",
	"e6a3",
	"e7a1",
	"e7a2",
	"e7a3",
	"e8a1",
	"e8a2",
	"e8a3",
	"e9a1",
	"e9a2",
	"e9a3",
	"e10a1",
	"e10a2",
	"e10a3",
	"e11a1",
	"e11a2",
	"e11a3",
	"e12a1",
	"e12a2",
	"e12a3",
	"e13a1",
	"e13a2",
	"e13a3",
	"e14a1",
	"e14a2",
	"e14a3",
	"e15a1",
	"e15a2",
	"e15a3",
]);

const SeasonIdShortComboSchema = z.object({
	id: z.string().uuid(),
	short: SeasonsEnum,
});

const RankingSchemasEnum = z.enum(["ascendant", "base"]);

type PlatformType = z.infer<typeof PlatformSchema>;
type ModeType = z.infer<typeof ModeSchema>;
type RegionType = z.infer<typeof RegionSchema>;

// Account Schemas
export const AccountSchema = z.object({
	puuid: z.string(),
	region: z.string(),
	account_level: z.number(),
	name: z.string().nullable(),
	tag: z.string().nullable(),
	card: z.string(),
	title: z.string(),
	platforms: z.array(z.string()),
	updated_at: z.string().datetime(),
});

const TierObjectSchema = z.object({
	id: z.number().int().min(0).max(27),
	name: TiersEnum,
});

export const MmrHistoryV2ItemSchema = z.object({
	match_id: z.string().uuid(),
	tier: TierObjectSchema,
	map: z.object({
		id: z.string().uuid(),
		name: z.enum([
			"Ascent",
			"Split",
			"Fracture",
			"Bind",
			"Breeze",
			"District",
			"Kasbah",
			"Piazza",
			"Lotus",
			"Pearl",
			"Icebox",
			"Haven",
		]),
	}),
	season: SeasonIdShortComboSchema,
	rr: z.number().int(),
	last_change: z.number().int(),
	elo: z.number().int(),
	refunded_rr: z.number().int(),
	was_derank_protected: z.boolean(),
	date: z.string().datetime(),
});

export const MmrHistoryV2Schema = z.object({
	account: z.object({
		puuid: z.string().uuid(),
		name: z.string(),
		tag: z.string(),
	}),
	history: z.array(MmrHistoryV2ItemSchema),
});

export const LeaderboardV3Schema = z.object({
	updated_at: z.string().datetime(),
	thresholds: z.array(
		z.object({
			tier: z.number(),
			start_index: z.number(),
			threshold: z.number(),
		}),
	),
	players: z.array(
		z.object({
			card: z.string(),
			title: z.string(),
			is_banned: z.boolean(),
			is_anonymized: z.boolean(),
			puuid: z.string(),
			name: z.string(),
			tag: z.string(),
			leaderboard_rank: z.number(),
			tier: z.number(),
			rr: z.number(),
			wins: z.number(),
			updated_at: z.string().datetime(),
		}),
	),
});

// MMR Schemas
export const MmrSchema = z.object({
	current_data: z.object({
		currenttier: z.number(),
		currenttierpatched: z.string(),
		images: z.object({
			small: z.string(),
			large: z.string(),
			triangle_down: z.string(),
			triangle_up: z.string(),
		}),
		ranking_in_tier: z.number(),
		mmr_change_to_last_game: z.number(),
		elo: z.number(),
		old: z.boolean(),
	}),
	highest_rank: z.object({
		old: z.boolean(),
		tier: z.number(),
		patched_tier: z.string(),
		season: z.string(),
	}),
	by_season: z
		.record(
			z.string(),
			z.object({
				error: z.boolean(),
				wins: z.number(),
				number_of_games: z.number(),
				final_rank: z.number(),
				final_rank_patched: z.string(),
				act_rank_wins: z.array(
					z.object({
						patched_tier: z.string(),
						tier: z.number(),
					}),
				),
				old: z.boolean(),
			}),
		)
		.optional(),
});

export const MmrV3Schema = z.object({
	account: z.object({
		puuid: z.string().uuid(),
		name: z.string(),
		tag: z.string(),
	}),
	peak: z
		.object({
			season: SeasonIdShortComboSchema,
			ranking_schema: RankingSchemasEnum,
			rr: z.number().int(),
			tier: TierObjectSchema,
		})
		.nullable(),
	current: z.object({
		tier: TierObjectSchema,
		rr: z.number().int(),
		last_change: z.number().int(),
		elo: z.number().int(),
		games_needed_for_rating: z.number().int(),
		rank_protection_shields: z.number().int(),
		leaderboard_placement: z
			.object({
				rank: z.number().int(),
				updated_at: z.string().datetime(),
			})
			.nullable(),
	}),
	seasonal: z.array(
		z.object({
			season: SeasonIdShortComboSchema,
			wins: z.number().int(),
			games: z.number().int(),
			end_tier: TierObjectSchema,
			end_rr: z.number().int(),
			ranking_schema: RankingSchemasEnum,
			leaderboard_placement: z
				.object({
					rank: z.number().int(),
					updated_at: z.string().datetime(),
				})
				.nullable(),
			act_wins: z.array(
				z.object({
					id: z.number().int().min(0).max(27),
					name: TiersEnum,
				}),
			),
		}),
	),
});

export const MmrHistorySchema = z.record(
	z.string(),
	z.object({
		error: z.boolean(),
		wins: z.number(),
		number_of_games: z.number(),
		final_rank: z.number(),
		final_rank_patched: z.string(),
		act_rank_wins: z.array(
			z.object({
				patched_tier: z.string(),
				tier: z.number(),
			}),
		),
		old: z.boolean(),
	}),
);

// Match Schemas
export const PlayerStatsSchema = z.object({
	score: z.number(),
	kills: z.number(),
	deaths: z.number(),
	assists: z.number(),
	bodyshots: z.number(),
	headshots: z.number(),
	legshots: z.number(),
});

export const PlayerEconomySchema = z.object({
	spent: z.object({
		overall: z.number(),
		average: z.number(),
	}),
	loadout_value: z.object({
		overall: z.number(),
		average: z.number(),
	}),
});

export const PlayerAbilityCastsSchema = z.object({
	c_cast: z.number(),
	q_cast: z.number(),
	e_cast: z.number(),
	x_cast: z.number(),
});

export const CharacterAssetsSchema = z.object({
	bust: z.string(),
	full: z.string(),
	killfeed: z.string(),
	display_icon: z.string(),
});

export const PlayerCharacterSchema = z.object({
	id: z.string(),
	name: z.string(),
	assets: CharacterAssetsSchema,
});

export const PlayerCardSchema = z.object({
	small: z.string(),
	large: z.string(),
	wide: z.string(),
	id: z.string(),
});

export const PlayerTitleSchema = z.object({
	id: z.string(),
	name: z.string(),
});

export const SessionPlaytimeSchema = z.object({
	seconds: z.number(),
	milliseconds: z.number(),
	microseconds: z.number(),
});

export const AgentAssetsSchema = z.object({
	small: z.string(),
	full: z.string(),
	bust: z.string(),
	killfeed: z.string(),
});

export const PlayerAssetsSchema = z.object({
	agent: AgentAssetsSchema,
});

export const PlayerSchema = z.object({
	puuid: z.string(),
	name: z.string(),
	tag: z.string(),
	team: z.string(),
	level: z.number(),
	character: PlayerCharacterSchema,
	currenttier: z.number(),
	currenttier_patched: z.string(),
	player_card: PlayerCardSchema,
	player_title: PlayerTitleSchema,
	party_id: z.string(),
	session_playtime: SessionPlaytimeSchema,
	assets: PlayerAssetsSchema,
	stats: PlayerStatsSchema,
	economy: PlayerEconomySchema,
	ability_casts: PlayerAbilityCastsSchema,
});

export const TeamDetailsSchema = z.object({
	has_won: z.boolean(),
	rounds_won: z.number(),
	rounds_lost: z.number(),
});

export const LocationSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export const PlayerLocationSchema = z.object({
	puuid: z.string(),
	view_radians: z.number(),
	location: LocationSchema,
});

export const PlantEventSchema = z.object({
	plant_location: LocationSchema,
	planted_by: PlayerLocationSchema,
	plant_site: z.string(),
	plant_time_in_round: z.number(),
	player_locations_on_plant: z.array(PlayerLocationSchema),
});

export const DefuseEventSchema = z.object({
	defuse_location: LocationSchema,
	defused_by: PlayerLocationSchema,
	defuse_time_in_round: z.number(),
	player_locations_on_defuse: z.array(PlayerLocationSchema),
});

export const FinishingDamageSchema = z.object({
	damage_type: z.string(),
	damage_item: z.string(),
	is_secondary_fire_mode: z.boolean(),
});

export const RoundAssetsSchema = z.object({
	asset_type: z.string(),
	asset_path: z.string(),
});

export const KillSchema = z.object({
	kill_time_in_round: z.number(),
	killer_puuid: z.string(),
	killer_display_name: z.string(),
	killer_team: z.string(),
	victim_puuid: z.string(),
	victim_display_name: z.string(),
	victim_team: z.string(),
	victim_location: LocationSchema,
	player_locations_on_kill: z.array(PlayerLocationSchema),
	finishing_damage: FinishingDamageSchema,
	round_assets: RoundAssetsSchema.optional(),
});

export const DamageSchema = z.object({
	receiver_puuid: z.string(),
	receiver_display_name: z.string(),
	receiver_team: z.string(),
	bodyshots: z.number(),
	headshots: z.number(),
	legshots: z.number(),
	damage: z.number(),
});

export const RoundEconomySchema = z.object({
	loadout_value: z.number(),
	remaining: z.number(),
	spent: z.number(),
});

export const RoundAbilitySchema = z.object({
	grenade_casts: z.number(),
	ability1_casts: z.number(),
	ability2_casts: z.number(),
	ultimate_casts: z.number(),
});

export const RoundPlayerStatsSchema = z.object({
	puuid: z.string(),
	kills: z.number(),
	kill_events: z.array(KillSchema),
	damage: z.number(),
	damage_events: z.array(DamageSchema),
	score: z.number(),
	economy: RoundEconomySchema,
	ability: RoundAbilitySchema,
	was_afk: z.boolean(),
	was_penalized: z.boolean(),
	stayed_in_spawn: z.boolean(),
});

export const RoundSchema = z.object({
	winning_team: z.string(),
	end_type: z.string(),
	bomb_planted: z.boolean(),
	bomb_defused: z.boolean(),
	plant_events: PlantEventSchema.optional(),
	defuse_events: DefuseEventSchema.optional(),
	player_stats: z.array(RoundPlayerStatsSchema),
});

export const MatchMetadataSchema = z.object({
	map: z.string(),
	game_version: z.string(),
	game_length: z.number(),
	game_start: z.number(),
	game_start_patched: z.string(),
	rounds_played: z.number(),
	mode: z.string(),
	mode_id: z.string(),
	queue: z.string(),
	season_id: z.string(),
	platform: z.string(),
	matchid: z.string(),
	premier_info: z
		.object({
			tournament_id: z.string().optional(),
			match_id: z.string().optional(),
		})
		.optional()
		.nullable(),
	region: z.string(),
	cluster: z.string(),
});

export const MatchSchema = z.object({
	metadata: MatchMetadataSchema,
	players: z.object({
		all_players: z.array(PlayerSchema),
		red: z.array(PlayerSchema),
		blue: z.array(PlayerSchema),
	}),
	teams: z.array(TeamDetailsSchema),
	rounds: z.array(RoundSchema),
});

export const MatchV4Schema = z.object({
	metadata: z
		.object({
			match_id: z.string().uuid().optional(),
			map: z
				.object({
					id: z.string().uuid().optional(),
					name: z.string().optional(),
				})
				.optional(),
			game_version: z.string().optional(),
			game_length_in_ms: z.number().optional(),
			started_at: z.string().optional(),
			is_completed: z.boolean().optional(),
			queue: z
				.object({
					id: z.string().optional(),
					name: z.string().nullish(),
					mode_type: z.string().nullish(),
				})
				.optional(),
			season: z
				.object({
					id: z.string().uuid().optional(),
					short: z.string().optional(),
				})
				.optional(),
			platform: z.string().optional(),
			premier: z.unknown().nullish(),
			party_rr_penaltys: z
				.array(
					z.object({
						party_id: z.string().uuid().optional(),
						penalty: z.number().optional(),
					}),
				)
				.optional(),
			region: z.string().optional(),
			cluster: z.string().nullish(),
		})
		.optional(),
	players: z
		.array(
			z.object({
				puuid: z.string().uuid().optional(),
				name: z.string().optional(),
				tag: z.string().optional(),
				team_id: z.string().optional(),
				platform: z.string().optional(),
				party_id: z.string().uuid().optional(),
				agent: z
					.object({
						id: z.string().uuid().optional(),
						name: z.string().nullish(),
					})
					.optional(),
				stats: z
					.object({
						score: z.number().optional(),
						kills: z.number().optional(),
						deaths: z.number().optional(),
						assists: z.number().optional(),
						headshots: z.number().optional(),
						legshots: z.number().optional(),
						bodyshots: z.number().optional(),
						damage: z
							.object({
								dealt: z.number().optional(),
								received: z.number().optional(),
							})
							.optional(),
					})
					.optional(),
				ability_casts: z
					.object({
						grenade: z.number().nullish(),
						ability_1: z.number().nullish(),
						ability_2: z.number().nullish(),
						ultimate: z.number().nullish(),
					})
					.optional(),
				tier: z
					.object({
						id: z.number().optional(),
						name: z.string().nullish(),
					})
					.optional(),
				card_id: z.string().uuid().optional(),
				title_id: z.string().uuid().optional(),
				prefered_level_border: z.string().uuid().nullish(),
				account_level: z.number().optional(),
				session_playtime_in_ms: z.number().optional(),
				behavior: z
					.object({
						afk_rounds: z.number().optional(),
						friendly_fire: z
							.object({
								incoming: z.number().optional(),
								outgoing: z.number().optional(),
							})
							.optional(),
						rounds_in_spawn: z.number().optional(),
					})
					.optional(),
				economy: z
					.object({
						spent: z
							.object({
								overall: z.number().optional(),
								average: z.number().optional(),
							})
							.optional(),
						loadout_value: z
							.object({
								overall: z.number().optional(),
								average: z.number().optional(),
							})
							.optional(),
					})
					.optional(),
			}),
		)
		.optional(),
	observers: z
		.array(
			z.object({
				puuid: z.string().uuid().optional(),
				name: z.string().optional(),
				tag: z.string().optional(),
				account_level: z.number().optional(),
				session_playtime_in_ms: z.number().optional(),
				card_id: z.string().uuid().optional(),
				title_id: z.string().uuid().optional(),
				party_id: z.string().uuid().optional(),
			}),
		)
		.optional(),
	coaches: z
		.array(
			z.object({
				puuid: z.string().uuid().optional(),
				team_id: z.string().optional(),
			}),
		)
		.optional(),
	teams: z
		.array(
			z.object({
				team_id: z.string().optional(),
				rounds: z
					.object({
						won: z.number().optional(),
						lost: z.number().optional(),
					})
					.optional(),
				won: z.boolean().optional(),
				premier_roster: z
					.object({
						id: z.string().uuid().optional(),
						name: z.string().optional(),
						tag: z.string().optional(),
						members: z.array(z.string().uuid()).optional(),
						customization: z
							.object({
								icon: z.string().optional(),
								image: z.string().uuid().optional(),
								primary_color: z.string().optional(),
								secondary_color: z.string().optional(),
								tertiary_color: z.string().optional(),
							})
							.optional(),
					})
					.nullish(),
			}),
		)
		.optional(),
	rounds: z
		.array(
			z.object({
				id: z.number().optional(),
				result: z.string().optional(),
				ceremony: z.string().optional(),
				winning_team: z.string().optional(),
				plant: z
					.object({
						round_time_in_ms: z.number().optional(),
						site: z.string().optional(),
						location: z
							.object({
								x: z.number().optional(),
								y: z.number().optional(),
							})
							.nullish(),
						player: z
							.object({
								puuid: z.string().uuid().optional(),
								name: z.string().optional(),
								tag: z.string().optional(),
								team: z.string().optional(),
							})
							.optional(),
						player_locations: z
							.array(
								z.object({
									puuid: z.string().uuid().optional(),
									name: z.string().optional(),
									tag: z.string().optional(),
									team: z.string().optional(),
									view_radians: z.number().optional(),
									location: z
										.object({
											x: z.number().optional(),
											y: z.number().optional(),
										})
										.nullish(),
								}),
							)
							.optional(),
					})
					.nullish(),
				defuse: z
					.object({
						round_time_in_ms: z.number().optional(),
						location: z
							.object({
								x: z.number().optional(),
								y: z.number().optional(),
							})
							.nullish(),
						player: z
							.object({
								puuid: z.string().uuid().optional(),
								name: z.string().optional(),
								tag: z.string().optional(),
								team: z.string().optional(),
							})
							.optional(),
						player_locations: z
							.array(
								z.object({
									puuid: z.string().uuid().optional(),
									name: z.string().optional(),
									tag: z.string().optional(),
									team: z.string().optional(),
									view_radians: z.number().optional(),
									location: z
										.object({
											x: z.number().optional(),
											y: z.number().optional(),
										})
										.nullish(),
								}),
							)
							.optional(),
					})
					.nullish(),
				stats: z
					.array(
						z.object({
							ability_casts: z
								.object({
									grenade: z.number().nullish(),
									ability_1: z.number().nullish(),
									ability_2: z.number().nullish(),
									ultimate: z.number().nullish(),
								})
								.optional(),
							player: z
								.object({
									puuid: z.string().uuid().optional(),
									name: z.string().optional(),
									tag: z.string().optional(),
									team: z.string().optional(),
								})
								.optional(),
							damage_events: z
								.array(
									z.object({
										puuid: z.string().uuid().optional(),
										name: z.string().optional(),
										tag: z.string().optional(),
										team: z.string().optional(),
										bodyshots: z.number().optional(),
										headshots: z.number().optional(),
										legshots: z.number().optional(),
										damage: z.number().optional(),
									}),
								)
								.optional(),
							stats: z
								.object({
									bodyshots: z.number().optional(),
									headshots: z.number().optional(),
									legshots: z.number().optional(),
									damage: z.number().optional(),
									kills: z.number().optional(),
									assists: z.number().optional(),
									score: z.number().optional(),
								})
								.optional(),
							economy: z
								.object({
									loadout_value: z.number().optional(),
									remaining: z.number().optional(),
									weapon: z
										.object({
											id: z.string().nullish(),
											name: z.string().nullish(),
											type: z.string().nullish(),
										})
										.optional(),
									armor: z
										.object({
											id: z.string().uuid().optional(),
											name: z.string().optional(),
										})
										.nullish(),
								})
								.optional(),
							was_afk: z.boolean().optional(),
							received_penalty: z.boolean().optional(),
							stayed_in_spawn: z.boolean().optional(),
						}),
					)
					.optional(),
			}),
		)
		.optional(),
	kills: z
		.array(
			z.object({
				round: z.number().optional(),
				time_in_round_in_ms: z.number().optional(),
				time_in_match_in_ms: z.number().optional(),
				killer: z
					.object({
						puuid: z.string().uuid().optional(),
						name: z.string().optional(),
						tag: z.string().optional(),
						team: z.string().optional(),
					})
					.optional(),
				victim: z
					.object({
						puuid: z.string().uuid().optional(),
						name: z.string().optional(),
						tag: z.string().optional(),
						team: z.string().optional(),
					})
					.optional(),
				assistants: z
					.array(
						z.object({
							puuid: z.string().uuid().optional(),
							name: z.string().optional(),
							tag: z.string().optional(),
							team: z.string().optional(),
						}),
					)
					.optional(),
				location: z
					.object({
						x: z.number().optional(),
						y: z.number().optional(),
					})
					.nullish(),
				weapon: z
					.object({
						id: z.string().optional(),
						name: z.string().nullish(),
						type: z.string().nullish(),
					})
					.optional(),
				secondary_fire_mode: z.boolean().optional(),
				player_locations: z
					.array(
						z.object({
							puuid: z.string().uuid().optional(),
							name: z.string().optional(),
							tag: z.string().optional(),
							team: z.string().optional(),
							view_radians: z.number().optional(),
							location: z
								.object({
									x: z.number().optional(),
									y: z.number().optional(),
								})
								.nullish(),
						}),
					)
					.optional(),
			}),
		)
		.optional(),
});

// Content Schemas
export const ContentAbilitySchema = z.object({
	slot: z.string(),
	displayName: z.string(),
	description: z.string(),
	displayIcon: z.string().nullable(),
});

export const ContentRoleSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	description: z.string(),
	displayIcon: z.string(),
	assetPath: z.string(),
});

export const ContentVoiceLineMediaSchema = z.object({
	id: z.number(),
	wwise: z.string(),
	wave: z.string(),
});

export const ContentVoiceLineSchema = z.object({
	minDuration: z.number(),
	maxDuration: z.number(),
	mediaList: z.array(ContentVoiceLineMediaSchema),
});

export const ContentCharacterSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	description: z.string(),
	developerName: z.string(),
	characterTags: z.array(z.string()).nullable(),
	displayIcon: z.string(),
	displayIconSmall: z.string(),
	bustPortrait: z.string().nullable(),
	fullPortrait: z.string().nullable(),
	fullPortraitV2: z.string().nullable(),
	killfeedPortrait: z.string(),
	background: z.string().nullable(),
	backgroundGradientColors: z.array(z.string()),
	assetPath: z.string(),
	isFullPortraitDuos: z.boolean(),
	isStillDiscoverable: z.boolean(),
	isBaseContent: z.boolean(),
	role: ContentRoleSchema.nullable(),
	abilities: z.array(ContentAbilitySchema),
	voiceLine: ContentVoiceLineSchema.nullable(),
});

export const ContentMapSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	narrativeDescription: z.string().nullable(),
	tacticalDescription: z.string().nullable(),
	coordinates: z.string().nullable(),
	displayIcon: z.string().nullable(),
	listViewIcon: z.string(),
	splash: z.string(),
	stylizedBackgroundImage: z.string().nullable(),
	premierBackgroundImage: z.string().nullable(),
	assetPath: z.string(),
	mapUrl: z.string(),
	xMultiplier: z.number(),
	yMultiplier: z.number(),
	xScalarMultiplier: z.number(),
	yScalarMultiplier: z.number(),
	teamRoles: z.array(z.string()).nullable(),
	is_andbox: z.boolean(),
});

export const ContentChromaSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	displayIcon: z.string().nullable(),
	fullRender: z.string().nullable(),
	swatch: z.string().nullable(),
	assetPath: z.string(),
});

export const ContentSkinLevelSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	displayIcon: z.string().nullable(),
	levelItem: z.string().nullable(),
	assetPath: z.string(),
});

export const ContentSkinSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	themeUuid: z.string().nullable(),
	contentTierUuid: z.string().nullable(),
	displayIcon: z.string().nullable(),
	fullRender: z.string().nullable(),
	assetPath: z.string(),
	chromas: z.array(ContentChromaSchema),
	levels: z.array(ContentSkinLevelSchema),
});

export const ContentBuddySchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	displayIcon: z.string(),
	assetPath: z.string(),
	isHiddenIfNotOwned: z.boolean(),
	themeUuid: z.string().nullable(),
	levelUuid: z.string().nullable(),
});

export const ContentPlayerCardSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	displayIcon: z.string(),
	smallArt: z.string(),
	wideArt: z.string(),
	largeArt: z.string(),
	assetPath: z.string(),
});

export const ContentPlayerTitleSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	titleText: z.string(),
	assetPath: z.string(),
	isHiddenIfNotOwned: z.boolean(),
});

export const ContentSpraySchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	category: z.string(),
	displayIcon: z.string(),
	fullIcon: z.string().nullable(),
	fullTransparentIcon: z.string().nullable(),
	animationPng: z.string().nullable(),
	animationGif: z.string().nullable(),
	assetPath: z.string(),
	themeUuid: z.string().nullable(),
	levelUuid: z.string().nullable(),
	isHiddenIfNotOwned: z.boolean(),
});

export const ContentGameModeSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	duration: z.string(),
	assetPath: z.string(),
	concept: z.string().nullable(),
	gameFeatureTags: z.array(z.string()).nullable(),
	displayIcon: z.string().nullable(),
	altModes: z.array(z.string()).nullable(),
});

export const ContentAgentSchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	description: z.string(),
	developerName: z.string(),
	characterTags: z.array(z.string()).nullable(),
	displayIcon: z.string(),
	displayIconSmall: z.string(),
	bustPortrait: z.string().nullable(),
	fullPortrait: z.string().nullable(),
	fullPortraitV2: z.string().nullable(),
	killfeedPortrait: z.string(),
	background: z.string().nullable(),
	backgroundGradientColors: z.array(z.string()),
	assetPath: z.string(),
	isFullPortraitDuos: z.boolean(),
	isStillDiscoverable: z.boolean(),
	isBaseContent: z.boolean(),
	role: ContentRoleSchema.nullable(),
	abilities: z.array(ContentAbilitySchema),
	voiceLine: ContentVoiceLineSchema.nullable(),
});

export const ContentCompetitiveTierSchema = z.object({
	uuid: z.string(),
	tier: z.number(),
	tierName: z.string(),
	division: z.string(),
	divisionName: z.string(),
	color: z.string(),
	backgroundColor: z.string(),
	smallIcon: z.string().nullable(),
	largeIcon: z.string().nullable(),
	rankTriangleDownIcon: z.string().nullable(),
	rankTriangleUpIcon: z.string().nullable(),
	assetPath: z.string(),
});

export const ContentCeremonySchema = z.object({
	uuid: z.string(),
	displayName: z.string(),
	assetPath: z.string(),
});

export const ContentSchema = z.object({
	version: z.string(),
	characters: z.array(ContentCharacterSchema),
	maps: z.array(ContentMapSchema),
	chromas: z.array(ContentChromaSchema),
	skins: z.array(ContentSkinSchema),
	skin_levels: z.array(ContentSkinLevelSchema),
	buddies: z.array(ContentBuddySchema),
	player_cards: z.array(ContentPlayerCardSchema),
	player_titles: z.array(ContentPlayerTitleSchema),
	sprays: z.array(ContentSpraySchema),
	game_modes: z.array(ContentGameModeSchema),
	agents: z.array(ContentAgentSchema),
	competitivetiers: z.array(ContentCompetitiveTierSchema),
	ceremonies: z.array(ContentCeremonySchema),
});

// Status Schemas
export const StatusIncidentUpdateTranslationSchema = z.object({
	content: z.string(),
	locale: z.string(),
});

export const StatusIncidentUpdateSchema = z.object({
	created_at: z.string(),
	updated_at: z.string(),
	publish: z.boolean(),
	id: z.number(),
	translations: z.array(StatusIncidentUpdateTranslationSchema),
	publish_locations: z.array(z.string()),
	author: z.string(),
});

export const StatusIncidentTitleSchema = z.object({
	content: z.string(),
	locale: z.string(),
});

export const StatusIncidentSchema = z.object({
	id: z.number(),
	maintenance_status: z.string().optional(),
	incident_severity: z.string().optional(),
	titles: z.array(StatusIncidentTitleSchema),
	updates: z.array(StatusIncidentUpdateSchema),
	created_at: z.string(),
	archive_at: z.string(),
	updated_at: z.string(),
	platforms: z.array(z.string()),
	translations: z.array(StatusIncidentUpdateTranslationSchema),
});

export const StatusSchema = z.object({
	maintenances: z.array(
		z.object({
			created_at: z.string(),
			archive_at: z.string(),
			updates: z.array(
				z.object({
					created_at: z.string(),
					updated_at: z.string(),
					publish: z.boolean(),
					id: z.number(),
					translations: z.array(
						z.object({
							content: z.string(),
							locale: z.string(),
						}),
					),
					publish_locations: z.array(z.string()),
					author: z.string(),
				}),
			),
			platforms: z.array(z.string()),
			updated_at: z.string(),
			id: z.number(),
			titles: z.array(
				z.object({
					content: z.string(),
					locale: z.string(),
				}),
			),
		}),
	),
	incidents: z.array(StatusIncidentSchema),
});

export const PremierConferencesEnum = z.enum([
	"EU_CENTRAL_EAST",
	"EU_WEST",
	"EU_MIDDLE_EAST",
	"EU_TURKEY",
	"NA_US_EAST",
	"NA_US_WEST",
	"LATAM_NORTH",
	"LATAM_SOUTH",
	"BR_BRAZIL",
	"KR_KOREA",
	"AP_ASIA",
	"AP_JAPAN",
	"AP_OCEANIA",
	"AP_SOUTH_ASIA",
]);

export const PremierTeamSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	tag: z.string(),
	enrolled: z.boolean(),
	stats: z.object({
		wins: z.number(),
		matches: z.number(),
		losses: z.number(),
	}),
	placement: z.object({
		points: z.number(),
		conference: z.string(),
		division: z.number().min(1).max(20),
		place: z.number(),
	}),
	customization: z.object({
		icon: z.string(),
		image: z.string(),
		primary: z.string(),
		secondary: z.string(),
		tertiary: z.string(),
	}),
	member: z.array(
		z.object({
			puuid: z.string(),
			name: z.string().nullable(),
			tag: z.string().nullable(),
		}),
	),
});

export const PremierTeamHistorySchema = z.object({
	league_matches: z.array(
		z.object({
			id: z.string().uuid(),
			points_before: z.number(),
			points_after: z.number(),
			started_at: z.string().datetime(),
		}),
	),
});

export const PartialPremierTeamSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	tag: z.string(),
	conference: PremierConferencesEnum,
	division: z.number().min(1).max(20),
	affinity: RegionSchema,
	region: RegionSchema,
	losses: z.number(),
	wins: z.number(),
	score: z.number(),
	ranking: z.number(),
	customization: z.object({
		icon: z.string(),
		image: z.string(),
		primary: z.string(),
		secondary: z.string(),
		tertiary: z.string(),
	}),
});

export const PremierLeaderboardSchema = z.array(PartialPremierTeamSchema);

export const PremierSeasonsEventTypesEnum = z.enum(["LEAGUE", "TOURNAMENT"]);
export const PremierSeasonsEventMapSelectionTypesEnum = z.enum([
	"RANDOM",
	"PICKBAN",
]);

export const PremierSeasonSchema = z.object({
	id: z.string().uuid(),
	championship_event_id: z.string().uuid(),
	championship_points_required: z.number(),
	starts_at: z.string().datetime(),
	ends_at: z.string().datetime(),
	enrollment_starts_at: z.string().datetime(),
	enrollment_ends_at: z.string().datetime(),
	events: z.array(
		z.object({
			id: z.string().uuid(),
			type: PremierSeasonsEventTypesEnum,
			starts_at: z.string().datetime(),
			ends_at: z.string().datetime(),
			conference_schedules: z.array(
				z.object({
					conference: PremierConferencesEnum,
					starts_at: z.string().datetime(),
					ends_at: z.string().datetime(),
				}),
			),
			map_selection: z.object({
				type: PremierSeasonsEventMapSelectionTypesEnum,
				maps: z.array(
					z.object({
						name: z.enum([
							"Ascent",
							"Split",
							"Fracture",
							"Bind",
							"Breeze",
							"District",
							"Kasbah",
							"Piazza",
							"Lotus",
							"Pearl",
							"Icebox",
							"Haven",
						]),
						id: z.string().uuid(),
					}),
				),
			}),
			points_required_to_participate: z.number(),
		}),
	),
	scheduled_events: z.array(
		z.object({
			event_id: z.string().uuid(),
			conference: PremierConferencesEnum,
			starts_at: z.string().datetime(),
			ends_at: z.string().datetime(),
		}),
	),
});

export const StoreFeaturedV2Schema = z.array(
	z.object({
		bundle_uuid: z.string(),
		seconds_remaining: z.number(),
		bundle_price: z.number(),
		whole_sale_only: z.boolean(),
		expires_at: z.string(),
		items: z.array(
			z.object({
				uuid: z.string(),
				name: z.string(),
				image: z.string(),
				type: z.string(),
				amount: z.number(),
				discount_percent: z.number(),
				base_price: z.number(),
				discounted_price: z.number(),
				promo_item: z.boolean(),
			}),
		),
	}),
);

export const StoreOffersV2Schema = z.object({
	offers: z.array(
		z.object({
			offer_id: z.string(),
			cost: z.number(),
			name: z.string(),
			icon: z.string().nullable(),
			type: z.enum([
				"skin_level",
				"skin_chroma",
				"buddy",
				"spray",
				"player_card",
				"player_title",
			]),
			skin_id: z.string(),
			content_tier: z.object({
				name: z.string(),
				dev_name: z.string(),
				icon: z.string(),
			}),
		}),
	),
});

export const EsportsScheduleItemSchema = z.object({
	date: z.string(),
	state: z.string(),
	type: z.string(),
	vod: z.string().nullable(),
	league: z.object({
		name: z.string(),
		identifier: z.string(),
		icon: z.string(),
		region: z.string(),
	}),
	tournament: z.object({
		name: z.string(),
		season: z.string(),
	}),
	match: z.object({
		id: z.string().nullable(),
		game_type: z.object({
			type: z.enum(["playAll", "bestOf"]).nullable(),
			count: z.number().nullable(),
		}),
		teams: z.array(
			z.object({
				name: z.string(),
				code: z.string(),
				icon: z.string(),
				has_won: z.boolean(),
				game_wins: z.number(),
				record: z.object({
					wins: z.number(),
					losses: z.number(),
				}),
			}),
		),
	}),
});

export const EsportsScheduleSchema = z.array(EsportsScheduleItemSchema);

export const QueueStatusSchema = z.array(
	z.object({
		mode: z.enum([
			"Competitive",
			"Custom Game",
			"Deathmatch",
			"Escalation",
			"Team Deathmatch",
			"New Map",
			"Replication",
			"Snowball Fight",
			"Spike Rush",
			"Swiftplay",
			"Unrated",
		]),
		mode_id: z.enum([
			"competitive",
			"custom",
			"deathmatch",
			"ggteam",
			"hurm",
			"newmap",
			"onefa",
			"snowball",
			"spikerush",
			"swiftplay",
			"unrated",
		]),
		enabled: z.boolean(),
		team_size: z.number(),
		number_of_teams: z.number(),
		party_size: z.object({
			max: z.number(),
			min: z.number(),
			invalid: z.array(z.number()),
			full_party_bypass: z.boolean(),
		}),
		high_skill: z.object({
			max_party_size: z.number(),
			min_tier: z.number(),
			max_tier: z.number(),
		}),
		ranked: z.boolean(),
		tournament: z.boolean(),
		skill_disparity: z.array(
			z.object({
				tier: z.number(),
				name: z.enum([
					"Unrated",
					"Unknown 1",
					"Unknown 2",
					"Iron 1",
					"Iron 2",
					"Iron 3",
					"Bronze 1",
					"Bronze 2",
					"Bronze 3",
					"Silver 1",
					"Silver 2",
					"Silver 3",
					"Gold 1",
					"Gold 2",
					"Gold 3",
					"Platinum 1",
					"Platinum 2",
					"Platinum 3",
					"Diamond 1",
					"Diamond 2",
					"Diamond 3",
					"Ascendant 1",
					"Ascendant 2",
					"Ascendant 3",
					"Immortal 1",
					"Immortal 2",
					"Immortal 3",
					"Radiant",
				]),
				max_tier: z.object({
					id: z.number(),
					name: z.enum([
						"Unrated",
						"Unknown 1",
						"Unknown 2",
						"Iron 1",
						"Iron 2",
						"Iron 3",
						"Bronze 1",
						"Bronze 2",
						"Bronze 3",
						"Silver 1",
						"Silver 2",
						"Silver 3",
						"Gold 1",
						"Gold 2",
						"Gold 3",
						"Platinum 1",
						"Platinum 2",
						"Platinum 3",
						"Diamond 1",
						"Diamond 2",
						"Diamond 3",
						"Ascendant 1",
						"Ascendant 2",
						"Ascendant 3",
						"Immortal 1",
						"Immortal 2",
						"Immortal 3",
						"Radiant",
					]),
				}),
			}),
		),
		required_account_level: z.number(),
		game_rules: z.object({
			overtime_win_by_two: z.boolean(),
			allow_lenient_surrender: z.boolean(),
			allow_drop_out: z.boolean(),
			assign_random_agents: z.boolean(),
			skip_pregame: z.boolean(),
			allow_overtime_draw_vote: z.boolean(),
			overtime_win_by_two_capped: z.boolean(),
			premier_mode: z.boolean(),
		}),
		platforms: z.array(z.enum(["pc", "console"])),
		maps: z.array(
			z.object({
				map: z.object({
					id: z.string().uuid(),
					name: z.enum([
						"Ascent",
						"Split",
						"Fracture",
						"Bind",
						"Breeze",
						"District",
						"Kasbah",
						"Piazza",
						"Lotus",
						"Pearl",
						"Icebox",
						"Haven",
					]),
				}),
				enabled: z.boolean(),
			}),
		),
	}),
);

// API Functions
export async function getAccount(
	name: string,
	tag: string,
): Promise<z.infer<typeof AccountSchema>> {
	return fetchValorantApi(`/valorant/v2/account/${name}/${tag}`);
}

export async function getAccountByPuuid(
	puuid: string,
): Promise<z.infer<typeof AccountSchema>> {
	return fetchValorantApi(`/valorant/v2/by-puuid/account/${puuid}`);
}

export async function getMmrV3(
	name: string,
	tag: string,
	region: RegionType,
	platform: PlatformType,
): Promise<z.infer<typeof MmrV3Schema>> {
	return fetchValorantApi(
		`/valorant/v3/by-puuid/mmr/${region}/${platform}/${name}/${tag}`,
	);
}

export async function getMmrByPuuidV3(
	puuid: string,
	region: RegionType,
	platform: PlatformType,
): Promise<z.infer<typeof MmrV3Schema>> {
	return fetchValorantApi(
		`/valorant/v3/by-puuid/mmr/${region}/${platform}/${puuid}`,
	);
}

export async function getMmrHistoryV2(
	name: string,
	tag: string,
	region: RegionType,
	platform: PlatformType,
): Promise<z.infer<typeof MmrHistoryV2Schema>> {
	return fetchValorantApi(
		`/valorant/v2/by-puuid/mmr-history/${region}/${platform}/${name}/${tag}`,
	);
}

export async function getMmrHistoryByPuuidV2(
	puuid: string,
	region: RegionType,
	platform: PlatformType,
): Promise<z.infer<typeof MmrHistoryV2Schema>> {
	return fetchValorantApi(
		`/valorant/v2/by-puuid/mmr-history/${region}/${platform}/${puuid}`,
	);
}

export async function getLeaderboardV3(
	region: RegionType,
	platform: PlatformType,
	puuid?: string,
	name?: string,
	tag?: string,
	season_short?: string,
	season_id?: string,
	size?: number,
	start_index?: number,
): Promise<z.infer<typeof LeaderboardV3Schema>> {
	const params = new URLSearchParams();
	if (puuid) params.append("puuid", puuid);
	if (name) params.append("name", name);
	if (tag) params.append("tag", tag);
	if (season_short) params.append("season_short", season_short);
	if (season_id) params.append("season_id", season_id);
	if (size) params.append("size", size.toString());
	if (start_index) params.append("start_index", start_index.toString());
	return fetchValorantApi(
		`/valorant/v3/leaderboard/${region}/${platform}?${params.toString()}`,
	);
}

export async function getMmrHistoryByPuuid(
	puuid: string,
	region: RegionType,
): Promise<z.infer<typeof MmrHistorySchema>> {
	return fetchValorantApi(
		`/valorant/v1/by-puuid/mmr-history/${region}/${puuid}`,
	);
}

export async function getMatches(
	name: string,
	tag: string,
	region: RegionType,
	platform: PlatformType,
	mode?: ModeType,
	size?: number,
	start?: number,
): Promise<z.infer<typeof MatchV4Schema>[]> {
	const params = new URLSearchParams();
	if (mode) params.append("mode", mode.toString());
	if (size) params.append("size", size.toString());
	if (start) params.append("start", start.toString());
	return fetchValorantApi(
		`/valorant/v4/matches/${region}/${platform}/${name}/${tag}?${params.toString()}`,
	);
}

export async function getMatchesByPuuid(
	puuid: string,
	region: RegionType,
	platform: PlatformType,
	mode?: ModeType,
	size?: number,
	start?: number,
): Promise<z.infer<typeof MatchV4Schema>[]> {
	const params = new URLSearchParams();
	if (mode) params.append("mode", mode.toString());
	if (size) params.append("size", size.toString());
	if (start) params.append("start", start.toString());
	return fetchValorantApi(
		`/valorant/v4/by-puuid/matches/${region}/${platform}/${puuid}?${params.toString()}`,
	);
}

export async function getMatch(
	matchId: string,
	region: RegionType,
): Promise<z.infer<typeof MatchV4Schema>> {
	return fetchValorantApi(`/valorant/v4/match/${region}/${matchId}`);
}

export async function getContent(
	locale?: string,
): Promise<z.infer<typeof ContentSchema>> {
	const params = new URLSearchParams();
	if (locale) params.append("locale", locale);
	return fetchValorantApi(`/valorant/v1/content?${params.toString()}`);
}

export async function getStatus(
	region: RegionType,
): Promise<z.infer<typeof StatusSchema>> {
	return fetchValorantApi(`/valorant/v1/status/${region}`);
}

export async function getLeaderboard(
	region: RegionType,
	puuid?: string,
	name?: string,
	tag?: string,
	season?: string,
): Promise<z.infer<typeof LeaderboardV3Schema>> {
	const params = new URLSearchParams();
	if (puuid) params.append("puuid", puuid);
	if (name) params.append("name", name);
	if (tag) params.append("tag", tag);
	if (season) params.append("season", season);
	return fetchValorantApi(
		`/valorant/v2/leaderboard/${region}?${params.toString()}`,
	);
}

export async function getPremierTeam(
	teamId: string,
): Promise<z.infer<typeof PremierTeamSchema>> {
	return fetchValorantApi(`/valorant/v1/premier/${teamId}`);
}

export async function getPremierTeamHistory(
	teamId: string,
): Promise<z.infer<typeof PremierTeamHistorySchema>> {
	return fetchValorantApi(`/valorant/v1/premier/${teamId}/history`);
}

export async function searchPremierTeams(
	name?: string,
	tag?: string,
	division?: number,
	conference?: z.infer<typeof PremierConferencesEnum>,
): Promise<z.infer<typeof PartialPremierTeamSchema>[]> {
	const params = new URLSearchParams();
	if (name) params.append("name", name);
	if (tag) params.append("tag", tag);
	if (division) params.append("division", division.toString());
	if (conference) params.append("conference", conference);
	return fetchValorantApi(`/valorant/v1/premier/search?${params.toString()}`);
}

export async function getPremierLeaderboard(
	region: RegionType,
	conference?: z.infer<typeof PremierConferencesEnum>,
	division?: number,
): Promise<z.infer<typeof PremierLeaderboardSchema>> {
	let url = `/valorant/v1/premier/leaderboard/${region}`;
	if (conference) {
		url += `/${conference}`;
		if (division) {
			url += `/${division}`;
		}
	}
	return fetchValorantApi(url);
}

export async function getPremierSeasons(
	region: RegionType,
): Promise<z.infer<typeof PremierSeasonSchema>[]> {
	return fetchValorantApi(`/valorant/v1/premier/seasons/${region}`);
}

export async function getStoreFeaturedV2(): Promise<
	z.infer<typeof StoreFeaturedV2Schema>
> {
	return fetchValorantApi(`/valorant/v2/store-featured`);
}

export async function getStoreOffersV2(): Promise<
	z.infer<typeof StoreOffersV2Schema>
> {
	return fetchValorantApi(`/valorant/v2/store-offers`);
}

export async function getEsportsSchedule(
	region?: string,
	league?: string,
): Promise<z.infer<typeof EsportsScheduleSchema>> {
	const params = new URLSearchParams();
	if (region) params.append("region", region);
	if (league) params.append("league", league);
	return fetchValorantApi(`/valorant/v1/esports/schedule?${params.toString()}`);
}

export async function getQueueStatus(
	region: RegionType,
): Promise<z.infer<typeof QueueStatusSchema>> {
	return fetchValorantApi(`/valorant/v1/queue-status/${region}`);
}

export async function generateCrosshairImage(id: string): Promise<string> {
	return fetchValorantApi(`/valorant/v1/crosshair/generate?id=${id}`);
}
