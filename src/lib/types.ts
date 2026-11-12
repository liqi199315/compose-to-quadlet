export type InputMode = 'compose-yaml' | 'docker-run';

export type InstallScope = 'rootless' | 'rootful';

export type SelinuxMode = 'none' | 'shared-z' | 'private-Z';

export interface QuadletConvertOptions {
	stackName: string;
	installScope: InstallScope;
	selinuxMode: SelinuxMode;
	enableAutoUpdate: boolean;
	generateSharedNetwork: boolean;
	extractSecretsToEnvFile: boolean;
}

export interface GeneratedUnitFile {
	filename: string;
	unitType: 'container' | 'network' | 'volume' | 'env';
	installPath: string;
	content: string;
}

export interface ConversionWarning {
	service?: string;
	field: string;
	message: string;
}

export type QuadletConversionResult =
	| {
			ok: true;
			inputMode: InputMode;
			serviceCount: number;
			files: GeneratedUnitFile[];
			warnings: ConversionWarning[];
			systemdCommands: string[];
	  }
	| {
			ok: false;
			error: string;
	  };

export type SampleTemplateId =
	| 'web-postgres-redis'
	| 'immich-stack'
	| 'vaultwarden-caddy'
	| 'nextcloud-mariadb'
	| 'docker-run-jellyfin';

export interface RouteFaqItem {
	question: string;
	answer: string;
}

export interface QuadletRoutePreset {
	slug: string;
	path: string;
	navLabel: string;
	h1: string;
	seoTitle: string;
	metaDescription: string;
	primaryKeyword: string;
	heroSummary: string;
	defaultInputMode: InputMode;
	defaultTemplateId: SampleTemplateId;
	defaultOptions: QuadletConvertOptions;
	technicalNotes: string[];
	faqs: RouteFaqItem[];
}
