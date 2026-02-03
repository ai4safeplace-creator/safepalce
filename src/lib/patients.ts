import { supabase } from "@/lib/supabase";

export interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    birth_date?: string;
    notes?: string;
    created_at: string;
}

export async function getPatients() {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('last_name', { ascending: true });

    if (error) throw error;
    return data as Patient[];
}

export async function createPatient(patient: Omit<Patient, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("createPatient: No active user session found");
        throw new Error("חייבת להיות מחוברת כדי להוסיף מטופל");
    }

    const insertData = {
        ...patient,
        therapist_id: user.id
    };

    console.log("createPatient: Attempting insert with:", insertData);

    const { data, error } = await supabase
        .from('patients')
        .insert([insertData])
        .select();

    if (error) {
        console.error("Supabase Error Details:", JSON.stringify(error, null, 2));
        throw error;
    }
    return data[0] as Patient;
}

export async function updatePatient(id: string, updates: Partial<Omit<Patient, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data[0] as Patient;
}

export async function deletePatient(id: string) {
    const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function updateSummary(sessionId: string, summaryText: string) {
    // Attempt to update the existing summary for this session
    const { data, error } = await supabase
        .from('summaries')
        .update({ summary_text: summaryText })
        .eq('session_id', sessionId)
        .select();

    if (error) throw error;

    // If no summary existed (unlikely but possible), insert one
    if (data.length === 0) {
        const { data: newData, error: insertError } = await supabase
            .from('summaries')
            .insert([{ session_id: sessionId, summary_text: summaryText }])
            .select();
        if (insertError) throw insertError;
        return newData[0];
    }

    return data[0];
}

export async function deleteSession(id: string) {
    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function getMonthStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: sessions, error } = await supabase
        .from('sessions')
        .select('session_date, patient_id')
        .gte('session_date', startOfMonth);

    if (error) throw error;

    const totalSessions = sessions.length;
    const uniquePatients = new Set(sessions.map(s => s.patient_id)).size;
    const workdays = new Set(sessions.map(s => new Date(s.session_date).toLocaleDateString())).size;

    return {
        totalSessions,
        uniquePatients,
        workdays
    };
}
