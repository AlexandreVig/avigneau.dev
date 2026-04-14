import type {
  BaseAppHostAPI,
  BaseAppInstance,
  BaseAppManifest,
  BaseAppModule,
  BaseAppMountContext,
} from '../../../core/types';

/**
 * iPod-specific app host API.
 *
 * Currently identical to the base — iPod apps don't need any extra shell
 * surface beyond setTitle/setIcon/close — but exporting this alias lets apps
 * import from one place and leaves room for future additions (e.g.
 * `setNavBarStyle`, `setLeftButton`).
 */
export type IpodAppHostAPI = BaseAppHostAPI;

export type IpodAppMountContext = BaseAppMountContext<IpodAppHostAPI>;

export type IpodAppInstance = BaseAppInstance;

export interface IpodAppModule
  extends BaseAppModule<IpodAppMountContext, IpodAppInstance> {
  mount(
    ctx: IpodAppMountContext,
  ): IpodAppInstance | void | Promise<IpodAppInstance | void>;
}

/** Where an app lives on the iPod home screen. */
export type IpodAppLocation = 'home' | 'dock';

export interface IpodAppManifest extends BaseAppManifest<IpodAppModule> {
  /** 57x57 iOS 1 icon PNG shown on the home screen or dock. */
  icon: string;
  /** Whether the app lives in the home-screen grid or the pinned dock. */
  location: IpodAppLocation;
  /** Ordering within its location (lower = earlier). */
  order: number;
  /**
   * i18n key for the app title. The static `title` is the English fallback
   * used during SSR; the client patches home-screen labels to `t(titleKey)`
   * after hydration.
   */
  titleKey?: string;
}
