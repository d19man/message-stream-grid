import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Image, Mic, Square, Layers } from "lucide-react";
import type { Template, TemplateKind } from "@/types";

interface TemplatePreviewDialogProps {
  template: Template;
  trigger?: React.ReactNode;
}

export const TemplatePreviewDialog = ({ template, trigger }: TemplatePreviewDialogProps) => {
  const getKindIcon = (kind: TemplateKind) => {
    switch (kind) {
      case "text": return <FileText className="h-4 w-4" />;
      case "image": return <Image className="h-4 w-4" />;
      case "audio": return <Mic className="h-4 w-4" />;
      case "button": return <Square className="h-4 w-4" />;
      case "image_text_button": return <Layers className="h-4 w-4" />;
    }
  };

  const getPoolBadgeColor = (pool: string) => {
    switch (pool) {
      case "CRM":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "BLASTER":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "WARMUP":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const renderPreview = () => {
    switch (template.kind) {
      case "text":
        return (
          <div className="bg-accent/20 rounded-lg p-4">
            <p className="whitespace-pre-wrap">{template.content_json.text}</p>
          </div>
        );

      case "image":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-accent rounded-lg aspect-video flex items-center justify-center">
              {template.content_json.mediaUrl ? (
                <img 
                  src={template.content_json.mediaUrl}
                  alt="Template preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className="text-muted-foreground">
                <Image className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Image Preview</p>
              </div>
            </div>
            {template.content_json.caption && (
              <div className="bg-accent/20 rounded-lg p-3">
                <p className="text-sm">{template.content_json.caption}</p>
              </div>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="space-y-3">
            <div className="bg-accent/20 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Mic className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="h-2 bg-primary/30 rounded-full">
                    <div className="h-2 bg-primary rounded-full w-1/3"></div>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">0:15</span>
              </div>
            </div>
            {template.content_json.caption && (
              <div className="bg-accent/20 rounded-lg p-3">
                <p className="text-sm">{template.content_json.caption}</p>
              </div>
            )}
          </div>
        );

      case "button":
        return (
          <div className="space-y-3">
            <div className="bg-accent/20 rounded-lg p-4">
              <p className="whitespace-pre-wrap mb-3">{template.content_json.text}</p>
              <div className="space-y-2">
                {template.content_json.buttons?.map((button: any, index: number) => (
                  <Button
                    key={button.id || index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case "image_text_button":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-accent rounded-lg aspect-video flex items-center justify-center mb-3">
              {template.content_json.mediaUrl ? (
                <img 
                  src={template.content_json.mediaUrl}
                  alt="Template preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className="text-muted-foreground">
                <Image className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Image Preview</p>
              </div>
            </div>
            <div className="bg-accent/20 rounded-lg p-4">
              <p className="whitespace-pre-wrap mb-3">{template.content_json.text}</p>
              <div className="space-y-2">
                {template.content_json.buttons?.map((button: any, index: number) => (
                  <Button
                    key={button.id || index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-accent/20 rounded-lg p-4 text-center text-muted-foreground">
            No preview available
          </div>
        );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Template Preview</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getKindIcon(template.kind)}
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{template.kind} template</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {template.allowed_in.map((pool) => (
                <Badge
                  key={pool}
                  variant="secondary"
                  className={`text-xs ${getPoolBadgeColor(pool)}`}
                >
                  {pool}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="font-medium mb-3">Preview</h4>
            {renderPreview()}
          </div>

          {/* Variables Info */}
          {(template.content_json.text || template.content_json.caption) && (
            <div>
              <h4 className="font-medium mb-2">Variables</h4>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  Variables like <code className="bg-accent px-1 rounded">{"{{name}}"}</code>, 
                  <code className="bg-accent px-1 rounded ml-1">{"{{company}}"}</code> will be 
                  replaced with actual values when sending.
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(template.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p>{new Date(template.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};