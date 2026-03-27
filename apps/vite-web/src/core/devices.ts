import { createClient } from "@/lib/supabase/browser";

export async function listDevices() {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("items")
        .select("id, name, photo_path")
        .eq("item_type", "device")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}
