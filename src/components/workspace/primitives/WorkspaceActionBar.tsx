import React from 'react';
import { WorkspaceResource } from '../../../runtime/workspaceResource';
import { InHouseButton } from '../../../runtime/primitives/Actions';
import { 
  Sparkles, 
  ShieldCheck, 
  Link2, 
  Calendar, 
  ExternalLink, 
  Reply, 
  Archive, 
  Edit3, 
  Share2, 
  Trash2 
} from 'lucide-react';

export interface WorkspaceActionBarProps {
  resource: WorkspaceResource;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onScheduleFollowUp?: (resource: WorkspaceResource) => void;
  onOpenExternal?: (resource: WorkspaceResource) => void;
  onReply?: (resource: WorkspaceResource) => void;
  onArchive?: (resource: WorkspaceResource) => void;
  onEdit?: (resource: WorkspaceResource) => void;
  onShare?: (resource: WorkspaceResource) => void;
  onDelete?: (resource: WorkspaceResource) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const WorkspaceActionBar: React.FC<WorkspaceActionBarProps> = ({
  resource,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onScheduleFollowUp,
  onOpenExternal,
  onReply,
  onArchive,
  onEdit,
  onShare,
  onDelete,
  size = 'sm',
  className = '',
}) => {
  const { capabilities, permissions } = resource;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* 1. Primary AI/Work Action */}
      {capabilities.createWorkItem && onCreateWorkItem && (
        <InHouseButton
          variant="primary"
          size={size}
          icon={Sparkles}
          onClick={() => onCreateWorkItem(resource)}
          title="Create or promote actionable Work Item with provenance"
        >
          Create Work
        </InHouseButton>
      )}

      {/* 2. Attach Evidence */}
      {capabilities.attachEvidence && onAttachEvidence && (
        <InHouseButton
          variant="contextual"
          size={size}
          icon={ShieldCheck}
          onClick={() => onAttachEvidence(resource)}
          title="Attach as cryptographic proof to active Work Item"
        >
          Attach Evidence
        </InHouseButton>
      )}

      {/* 3. Link Existing Work Item */}
      {capabilities.linkToWorkItem && onLinkWorkItem && (
        <InHouseButton
          variant="secondary"
          size={size}
          icon={Link2}
          onClick={() => onLinkWorkItem(resource)}
          title="Associate with an existing operational Work Item"
        >
          Link Work
        </InHouseButton>
      )}

      {/* 4. Schedule Follow-up / Calendar sync */}
      {capabilities.scheduleFollowUp && onScheduleFollowUp && (
        <InHouseButton
          variant="secondary"
          size={size}
          icon={Calendar}
          onClick={() => onScheduleFollowUp(resource)}
          title="Schedule follow-up meeting or reminder"
        >
          Follow-up
        </InHouseButton>
      )}

      {/* 5. Reply (Gmail) */}
      {capabilities.reply && onReply && (
        <InHouseButton
          variant="secondary"
          size={size}
          icon={Reply}
          onClick={() => onReply(resource)}
          title="Draft policy-verified email response"
        >
          Reply
        </InHouseButton>
      )}

      {/* 6. Edit */}
      {capabilities.edit && permissions.canEdit && onEdit && (
        <InHouseButton
          variant="secondary"
          size={size}
          icon={Edit3}
          onClick={() => onEdit(resource)}
          title="Edit resource"
        >
          Edit
        </InHouseButton>
      )}

      {/* 7. Share */}
      {capabilities.share && permissions.canShare && onShare && (
        <InHouseButton
          variant="quiet"
          size={size}
          icon={Share2}
          onClick={() => onShare(resource)}
          title="Manage sharing & permissions"
        >
          Share
        </InHouseButton>
      )}

      {/* 8. Archive */}
      {capabilities.archive && onArchive && (
        <InHouseButton
          variant="quiet"
          size={size}
          icon={Archive}
          onClick={() => onArchive(resource)}
          title="Archive resource"
        >
          Archive
        </InHouseButton>
      )}

      {/* 9. Open Original */}
      {capabilities.open && (
        onOpenExternal ? (
          <button
            type="button"
            onClick={() => onOpenExternal(resource)}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs cursor-pointer"
            title="Open in official Google Workspace application"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google {resource.provider}</span>
          </button>
        ) : (
          <a
            href={resource.provenanceUri || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs"
            title="Open in official Google Workspace application"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google {resource.provider}</span>
          </a>
        )
      )}

      {/* 10. Delete */}
      {permissions.canDelete && onDelete && (
        <InHouseButton
          variant="destructive"
          size={size}
          icon={Trash2}
          onClick={() => onDelete(resource)}
          title="Delete resource"
        >
          Delete
        </InHouseButton>
      )}
    </div>
  );
};
