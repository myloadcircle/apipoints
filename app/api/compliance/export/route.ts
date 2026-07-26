import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { exportType, teamId } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fileUrl = `/exports/${teamId}/${exportType}_${Date.now()}.json`;
  
  await supabase.from("compliance_exports").insert({
    team_id: teamId,
    export_type: exportType,
    file_url: fileUrl
  });

  return NextResponse.json({ fileUrl });
}
