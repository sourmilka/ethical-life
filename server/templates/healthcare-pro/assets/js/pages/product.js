/**
 * Product Detail Page — Dynamic (SSR-rendered)
 * All product content is server-rendered by product.ejs.
 * This JS handles client-side interactivity only.
 */

import { initTopBar } from '../components/topbar.js';
import { initSidebar } from '../components/sidebar.js';

initTopBar();
initSidebar();
