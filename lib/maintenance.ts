import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function checkMaintenance() {
  try {
    const maintenanceSetting = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, "MAINTENANCE_MODE"))
      .limit(1);

    const isMaintenance = maintenanceSetting.length > 0 && maintenanceSetting[0].value === "true";
    
    if (isMaintenance) {
      const session = await getSession();
      const isPanitia = [
        "admin", 
        "pengurus_daerah", 
        "kmm_daerah", 
        "tim_pnkb", 
        "admin_romantic_room", 
        "admin_keuangan", 
        "admin_kegiatan"
      ].includes(session?.role || "");

      if (!isPanitia) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
    return false;
  }
}
