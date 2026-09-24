/**
 * Centralized content-collection query helpers. Every page that lists
 * announcements/matches/tournaments/documents/galleries goes through
 * these functions so the visibility rules from spec §7 (draft never
 * public, future never early, expired never active) are enforced in
 * exactly one place instead of being re-implemented per page.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { isAnnouncementActive, isAnnouncementVisibleInArchive } from './dates';

export async function getActiveAnnouncements(): Promise<CollectionEntry<'announcements'>[]> {
  const all = await getCollection('announcements');
  const now = new Date();
  return all
    .filter((entry) => isAnnouncementActive(entry.data, now))
    .sort((a, b) => {
      if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
      if (a.data.priority !== b.data.priority) return b.data.priority - a.data.priority;
      return b.data.publishAt.getTime() - a.data.publishAt.getTime();
    });
}

/** Archive view: everything ever published (including expired/archived), newest first. Drafts still excluded. */
export async function getArchivedAnnouncements(): Promise<CollectionEntry<'announcements'>[]> {
  const all = await getCollection('announcements');
  const now = new Date();
  return all
    .filter((entry) => isAnnouncementVisibleInArchive(entry.data, now))
    .sort((a, b) => b.data.publishAt.getTime() - a.data.publishAt.getTime());
}

export async function getPublishedMatches(): Promise<CollectionEntry<'matches'>[]> {
  const all = await getCollection('matches');
  return all.filter((e) => e.data.published).sort((a, b) => b.data.dateTime.getTime() - a.data.dateTime.getTime());
}

export async function getPublishedTournaments(): Promise<CollectionEntry<'tournaments'>[]> {
  const all = await getCollection('tournaments');
  return all.filter((e) => e.data.published);
}

export async function getActiveTeams(): Promise<CollectionEntry<'teams'>[]> {
  const all = await getCollection('teams');
  return all.filter((e) => e.data.active).sort((a, b) => a.data.order - b.data.order);
}

export async function getActiveDocuments(): Promise<CollectionEntry<'documents'>[]> {
  const all = await getCollection('documents');
  return all.filter((e) => e.data.status === 'Aktif' && e.data.approved).sort((a, b) => a.data.order - b.data.order);
}

export async function getPublishedGalleries(): Promise<CollectionEntry<'galleries'>[]> {
  const all = await getCollection('galleries');
  return all.filter((e) => e.data.published).sort((a, b) => a.data.order - b.data.order);
}

export async function getActiveSports(): Promise<CollectionEntry<'sports'>[]> {
  const all = await getCollection('sports');
  return all.filter((e) => e.data.active).sort((a, b) => a.data.order - b.data.order);
}
