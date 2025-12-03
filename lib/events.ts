import { supabase, Event } from './supabase';

/**
 * Fetch only public events (excludes private events)
 * Use this for home page, browse page, and any public listings
 */
export async function getPublicEvents(limit?: number) {
  const query = supabase
    .from('events')
    .select('*')
    .eq('is_private', false)
    .order('created_at', { ascending: false });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching public events:', error);
    return [];
  }

  return data as Event[];
}

/**
 * Fetch a single event by ID (works for both public and private events)
 * Private events can still be accessed via direct link
 */
export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data as Event;
}

/**
 * Fetch events by organizer (includes both public and private)
 * Use this for user dashboards
 */
export async function getEventsByOrganizer(organizerId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organizer events:', error);
    return [];
  }

  return data as Event[];
}

/**
 * Fetch contributions for an event
 */
export async function getEventContributions(eventId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching contributions:', error);
    return [];
  }

  return data;
}

/**
 * Get contributor count for an event
 */
export async function getEventContributorCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('contributions')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching contributor count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get total contributors across all events for an organizer
 */
export async function getTotalContributorsForOrganizer(organizerId: string): Promise<number> {
  // Get all event IDs for this organizer
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', organizerId);

  if (eventsError || !events || events.length === 0) {
    return 0;
  }

  const eventIds = events.map(e => e.id);

  // Get all contributions and count unique emails
  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('contributor_email')
    .in('event_id', eventIds);

  if (error) {
    console.error('Error fetching total contributors:', error);
    return 0;
  }

  if (!contributions || contributions.length === 0) {
    return 0;
  }

  // Count unique contributors by email
  const uniqueEmails = new Set(contributions.map(c => c.contributor_email));
  return uniqueEmails.size;
}

/**
 * Get profile by wallet address
 */
export async function getProfileByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found - return null
      return null;
    }
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Get dashboard stats for an organizer
 */
export async function getDashboardStats(organizerId: string, walletAddress: string) {
  // Get all events for this organizer
  const events = await getEventsByOrganizer(organizerId);

  // Calculate stats
  const totalRaised = events.reduce((sum, event) => sum + (event.raised_cents || 0), 0);
  const totalEvents = events.length;
  const activeEvents = events.filter(event => {
    const raised = event.raised_cents || 0;
    const target = event.target_cents;
    return raised < target;
  }).length;
  const totalContributors = await getTotalContributorsForOrganizer(organizerId);

  // Get profile
  const profile = await getProfileByWallet(walletAddress);

  return {
    totalRaised,
    totalEvents,
    activeEvents,
    totalContributors,
    profile,
    events,
  };
}

