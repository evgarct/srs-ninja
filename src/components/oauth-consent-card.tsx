import { Bot, BookOpen, FilePlus2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export type OAuthConsentLabels = {
  eyebrow: string; title: string; description: string; permissions: string; readDecks: string; readDrafts: string; createDrafts: string; noPublish: string; approve: string; deny: string; redirectLabel: string
}

export function OAuthConsentCard({ authorizationId, clientName, clientUri, redirectUri, labels, action }: {
  authorizationId: string; clientName: string; clientUri?: string; redirectUri: string; labels: OAuthConsentLabels; action?: (formData: FormData) => void | Promise<void>
}) {
  const safeClientUri = clientUri && /^https?:\/\//i.test(clientUri) ? clientUri : undefined
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted"><Bot aria-hidden="true" /></div>
          <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{labels.eyebrow}</p><CardTitle>{labels.title}</CardTitle></div>
        </div>
        <CardDescription>{labels.description.replace('{client}', clientName)}</CardDescription>
        {safeClientUri && <a className="truncate text-sm underline underline-offset-4" href={safeClientUri} rel="noreferrer" target="_blank">{safeClientUri}</a>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm font-medium">{labels.permissions}</p>
        <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><BookOpen aria-hidden="true" />{labels.readDecks}</li>
          <li className="flex items-start gap-2"><ShieldCheck aria-hidden="true" />{labels.readDrafts}</li>
          <li className="flex items-start gap-2"><FilePlus2 aria-hidden="true" />{labels.createDrafts}</li>
          <li className="flex items-start gap-2"><ShieldCheck aria-hidden="true" />{labels.noPublish}</li>
        </ul>
        <p className="break-all text-xs text-muted-foreground">{labels.redirectLabel}: {redirectUri}</p>
      </CardContent>
      <CardFooter>
        <form action={action} className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <Button type="submit" name="decision" value="deny" variant="outline">{labels.deny}</Button>
          <Button type="submit" name="decision" value="approve">{labels.approve}</Button>
        </form>
      </CardFooter>
    </Card>
  )
}
