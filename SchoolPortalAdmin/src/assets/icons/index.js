import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import SearchIcon from '@mui/icons-material/Search';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import ArchiveIcon from '@mui/icons-material/Archive';
import { COLORS } from '../colors';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import SettingsInputSvideoIcon from '@mui/icons-material/SettingsInputSvideo';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FilterVintageIcon from '@mui/icons-material/FilterVintage';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import NoteIcon from '@mui/icons-material/Note';
import SubjectIcon from '@mui/icons-material/Subject';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ViewListIcon from '@mui/icons-material/ViewList';
import PublishIcon from '@mui/icons-material/Publish';
import LinkIcon from '@mui/icons-material/Link';
import CircularProgress from '@mui/material/CircularProgress';

export const ICONS = {
    arrowBack: {
        component: ArrowBackIcon,
        sx: {
            color: COLORS?.secondary,
            fontSize: '30px',
            cursor: 'pointer'

        }
    },
    SearchIcon: {
        component: SearchIcon,
        sx: {
            color: COLORS.primary,
            fontSize: '25px',

        }
    },
    FullscreenIcon: {
        component: FullscreenIcon,
        sx: {
            cursor: 'pointer',
            color: COLORS.white,
            fontSize: '40px',

        }
    },
    NotificationsActiveIcon: {
        component: NotificationsActiveIcon,
        sx: {
            color: COLORS.white,
            fontSize: '25px',

        }
    },
    RemoveRedEyeIcon: {
        component: RemoveRedEyeIcon,
        sx: {
            color: COLORS?.secondary,
            // eslint-disable-next-line no-dupe-keys
            "&:hover": { color: "#000" }, color: COLORS?.secondary,
            cursor: 'pointer'
        }
    },
    BorderColorIcon: {
        component: BorderColorIcon,
        sx: {
            color: COLORS?.secondary,
            // eslint-disable-next-line no-dupe-keys
            "&:hover": { color: "#000" }, color: COLORS?.secondary,
            cursor: 'pointer'
        }
    },
    CameraAltIcon: {
        component: CameraAltIcon,
        sx: {
            color: COLORS?.secondary,
            // eslint-disable-next-line no-dupe-keys
            "&:hover": { color: "#000" }, color: COLORS?.secondary,
            cursor: 'pointer'
        }
    },
    ErrorIcon: {
        component: ErrorIcon,
        sx: {
            color: COLORS?.secondary,

        }
    },
    CheckCircleIcon: {
        component: CheckCircleIcon,
    },
    Check: {
        component: CheckIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.success || '#10b981',
        }
    },
    Archive: {
        component: ArchiveIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.warning || '#f59e0b',
        }
    },
    SettingsInputSvideoIcon: {
        component: SettingsInputSvideoIcon,
        sx: {
            fontSize: 40,
            cursor: 'pointer',
            color: COLORS?.secondary,

        }
    },
    DeleteForeverIcon: {
        component: DeleteForeverIcon,
        sx: {
            fontSize: 30,
            cursor: 'pointer',
            color: COLORS?.secondary,

        }
    },
    FilterVintageIcon: {
        component: FilterVintageIcon,
        sx: {
            fontSize: 50,
            cursor: 'pointer',
            color: COLORS?.secondary,

        }
    },
    SettingsIcon: {
        component: SettingsIcon,
        sx: {
            fontSize: 50,
            cursor: 'pointer',
            color: COLORS?.secondary,

        }
    },
    Eye: {
        component: VisibilityIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Edit: {
        component: EditIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.secondary,
        }
    },
    Delete: {
        component: DeleteIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.error,
        }
    },
    Refresh: {
        component: RefreshIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    ExpandMore: {
        component: ExpandMoreIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Add: {
        component: AddIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Save: {
        component: SaveIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Search: {
        component: SearchIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Visibility: {
        component: VisibilityIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    CloudUpload: {
        component: CloudUploadIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    AttachFile: {
        component: AttachFileIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    PictureAsPdf: {
        component: PictureAsPdfIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.error,
        }
    },
    Description: {
        component: DescriptionIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Slideshow: {
        component: SlideshowIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.warning,
        }
    },
    Image: {
        component: ImageIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.success,
        }
    },
    Download: {
        component: DownloadIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Info: {
        component: InfoIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Help: {
        component: HelpIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Announcement: {
        component: AnnouncementIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Note: {
        component: NoteIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Subject: {
        component: SubjectIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    ArrowForward: {
        component: ArrowForwardIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    ArrowBack: {
        component: ArrowBackIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    ViewList: {
        component: ViewListIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Publish: {
        component: PublishIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    },
    Link: {
        component: LinkIcon,
        sx: {
            fontSize: 20,
            cursor: 'pointer',
            color: COLORS?.primary,
        }
    }


}