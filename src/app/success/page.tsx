
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background font-sans flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center justify-center gap-4 text-2xl">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        Sucesso!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-lg text-muted-foreground">
                        Os dados foram enviados corretamente.
                    </p>
                    <p className="text-md text-muted-foreground">
                        Aguardamos o seu próximo envio para o período da tarde.
                    </p>
                    <Link href="/" passHref>
                        <Button className="w-full text-lg">
                           Voltar para o Início
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
