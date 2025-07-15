import { z } from "zod";

const API_ENDPOINT = "https://api.aimlab.gg/graphql";

export const GET_USER_INFO = `
  query GetProfile($username: String) {
    aimlabProfile(username: $username) {
      username
      user {
        id
      }
      ranking {
        rank {
          displayName
          tier
          level
          minSkill
          maxSkill
        }
        skill
      }
      skillScores {
        name
        score
      }
    }
  }
`;

export const UserInfoSchema = z.object({
	data: z.object({
		aimlabProfile: z.object({
			user: z.object({
				id: z.string(),
			}),
			ranking: z.object({
				displayName: z.string(),
				tier: z.string(),
				level: z.number(),
				minSkill: z.number(),
				maxSkill: z.number(),
			}),
			skill: z.number(),
		}),
		skillScores: z.array(
			z.object({
				name: z.string(),
				score: z.number(),
			}),
		),
	}),
});

export type UserInfoSchemaType = z.infer<typeof UserInfoSchema>;

export const GET_USER_PLAYS_AGG = `
  query GetAimlabProfileAgg($where: AimlabPlayWhere!) {
    aimlab {
      plays_agg(where: $where) {
        group_by {
          task_id
          task_name
        }
        aggregate {
          count
          avg {
            score
            accuracy
          }
          max {
            score
            accuracy
            created_at
          }
        }
      }
    }
  }
`;

export const UserPlaysAggSchema = z.object({
	data: z.object({
		aimlab: z.object({
			plays_agg: z.array(
				z.object({
					group_by: z.object({
						task_id: z.string(),
						task_name: z.string(),
					}),
					aggregate: z.object({
						count: z.number(),
						avg: z.number(),
					}),
					max: z.object({
						score: z.number(),
						accuracy: z.number(),
						created_at: z.string().datetime(),
					}),
				}),
			),
		}),
	}),
});

export type UserPlaysAggSchemaType = z.infer<typeof UserPlaysAggSchema>;

export async function APIFetch<T>(query: string, variables: object) {
	const response = await fetch(API_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query: query,
			variables: variables,
		}),
	}).then((r) => r.json());

	return response as T;
}

export async function getUserInfo(
	username: string,
): Promise<UserInfoSchemaType> {
	return await APIFetch<UserInfoSchemaType>(GET_USER_INFO, {
		username: username,
	});
}

export async function getPlaysAgg(
	userId: string,
): Promise<UserPlaysAggSchemaType> {
	return await APIFetch<UserPlaysAggSchemaType>(GET_USER_PLAYS_AGG, {
		where: {
			is_practice: {
				_eq: false,
			},
			score: {
				_gt: 0,
			},
			user_id: {
				_eq: userId,
			},
		},
	});
}
