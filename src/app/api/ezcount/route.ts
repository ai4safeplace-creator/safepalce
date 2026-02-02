import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const response = await fetch("https://api.ezcount.co.il/api/createDoc", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('EZcount proxy error:', error);
        return NextResponse.json(
            { success: false, errMsg: 'Failed to connect to EZcount' },
            { status: 500 }
        );
    }
}
