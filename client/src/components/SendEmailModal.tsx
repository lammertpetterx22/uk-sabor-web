import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: "event" | "course" | "class";
  onSend: (subject: string, body: string) => Promise<void>;
  isSending?: boolean;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  itemName,
  itemType,
  onSend,
  isSending = false,
}: SendEmailModalProps) {
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      alert("Please fill in both subject and message");
      return;
    }
    await onSend(subject, body);
    setSubject("");
    setBody("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email - {itemName}</DialogTitle>
          <DialogDescription>
            Send an email about this {itemType} to all contacts in your database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Subject</label>
            <Input
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Message</label>
            <Textarea
              placeholder="Email message body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              className="mt-1 min-h-[200px]"
            />
            <p className="text-xs text-foreground/50 mt-2">
              Tip: Include event/course/class name and details in your message.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !body.trim()}
              className="btn-vibrant"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
