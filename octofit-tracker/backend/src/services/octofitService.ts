import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function inputRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw httpError(400, 'Invalid request body');
  return input as Record<string, unknown>;
}

function objectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) throw httpError(400, `Invalid ${field}`);
  return new Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = inputRecord(input);
  const userId = objectId(body.userId, 'userId');
  const teamId = objectId(body.teamId, 'teamId');
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutes = typeof body.minutes === 'number' ? body.minutes : NaN;
  if (!type || !Number.isFinite(minutes) || minutes <= 0) throw httpError(400, 'Invalid activity');
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');
  return Activity.create({ user: userId, team: teamId, type, minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = inputRecord(input);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';
  if (!name || !mascot) throw httpError(400, 'Team name and mascot are required');
  const memberIds = Array.isArray(body.members) ? body.members.map((member) => objectId(member, 'member')) : [];
  if (memberIds.length && await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw httpError(404, 'Team member not found');
  }
  return Team.create({ name, mascot, members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals.map((total, index) => ({ teamName: names.get(total._id.toString()) ?? 'Unknown team', totalPoints: total.totalPoints, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: decodeURIComponent(userEmail) }).lean();
  if (!user) throw httpError(404, 'User not found');
  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const focus = recent[0]?.type === 'run' ? 'endurance' : user.fitnessGoal;
  const workouts = await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: recent[0] ? `Based on your recent ${recent[0].type} activity.` : `Matched to your ${focus} fitness goal.`,
  }));
}

export { User };
