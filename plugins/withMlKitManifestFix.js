const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withMlKitManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    application["meta-data"] = application["meta-data"] || [];

    const key = "com.google.mlkit.vision.DEPENDENCIES";

    let metadata = application["meta-data"].find(
      (item) => item.$?.["android:name"] === key
    );

    if (!metadata) {
      metadata = { $: { "android:name": key } };
      application["meta-data"].push(metadata);
    }

    metadata.$["android:value"] = "barcode_ui,subject_segment";
    metadata.$["tools:replace"] = "android:value";

    manifest.manifest.$["xmlns:tools"] =
      "http://schemas.android.com/tools";

    return config;
  });
};
