import { supabase } from "./supabase";
import type { Member, MemberAddress } from "@shared/types";

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create or get member for the current user
export async function createOrGetMember(
  userId: string,
  userData: {
    name: string;
    phone: string;
    email?: string | null;
  }
): Promise<{ member: Member | null; created: boolean; error: Error | null }> {
  // Check if member already exists for this user
  const { data: existingMember, error: fetchError } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existingMember) {
    return {
      member: mapMemberFromDb(existingMember),
      created: false,
      error: null,
    };
  }

  // Create new member
  const { data: newMember, error: createError } = await supabase
    .from("members")
    .insert({
      user_id: userId,
      name: userData.name,
      phone: userData.phone,
      email: userData.email || null,
      role: "member",
      points_balance: 0,
      referral_code: generateReferralCode(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating member:", createError);
    return { member: null, created: false, error: new Error(createError.message) };
  }

  // Update user role in users table
  await supabase
    .from("users")
    .update({ role: "member", updated_at: new Date().toISOString() })
    .eq("id", userId);

  return {
    member: mapMemberFromDb(newMember),
    created: true,
    error: null,
  };
}

// Save address for member
export async function saveMemberAddress(
  memberId: string,
  address: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postcode: string;
    isDefault?: boolean;
  }
): Promise<{ address: MemberAddress | null; error: Error | null }> {
  // Check if this is the first address
  const { data: existingAddresses } = await supabase
    .from("member_addresses")
    .select("id")
    .eq("member_id", memberId);

  const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

  const { data, error } = await supabase
    .from("member_addresses")
    .insert({
      member_id: memberId,
      recipient_name: address.recipientName,
      phone: address.phone,
      address_line_1: address.addressLine1,
      address_line_2: address.addressLine2 || null,
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      is_default: address.isDefault ?? isFirstAddress,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving address:", error);
    return { address: null, error: new Error(error.message) };
  }

  return { address: mapAddressFromDb(data), error: null };
}

// Get member by user ID
export async function getMemberByUserId(
  userId: string
): Promise<{ member: Member | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" which is expected
    console.error("Error fetching member:", error);
    return { member: null, error: new Error(error.message) };
  }

  return { member: data ? mapMemberFromDb(data) : null, error: null };
}

// Get member addresses
export async function getMemberAddresses(
  memberId: string
): Promise<{ addresses: MemberAddress[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("member_addresses")
    .select("*")
    .eq("member_id", memberId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return { addresses: [], error: new Error(error.message) };
  }

  return { addresses: (data || []).map(mapAddressFromDb), error: null };
}

// Map database row to Member type
function mapMemberFromDb(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    name: row.name as string,
    phone: row.phone as string,
    email: row.email as string | null,
    role: row.role as string,
    pointsBalance: row.points_balance as number | null,
    preferredFlavor: row.preferred_flavor as string | null,
    preferredPackage: row.preferred_package as string | null,
    referralCode: row.referral_code as string | null,
    referrerId: row.referrer_id as string | null,
    createdAt: row.created_at as string | null,
  };
}

// Map database row to MemberAddress type
function mapAddressFromDb(row: Record<string, unknown>): MemberAddress {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    label: row.label as string | null,
    recipientName: row.recipient_name as string,
    phone: row.phone as string,
    addressLine1: row.address_line_1 as string,
    addressLine2: row.address_line_2 as string | null,
    city: row.city as string,
    state: row.state as string,
    postcode: row.postcode as string,
    isDefault: row.is_default as boolean | null,
    createdAt: row.created_at as string | null,
  };
}
