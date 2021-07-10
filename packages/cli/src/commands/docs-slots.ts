import { GluegunToolbox } from "gluegun";

module.exports = {
  name: "docs-slots",

  run: async (toolbox: GluegunToolbox) => {
    const {
      filesystem: fs,
      // print: {
      //   info
      // }
    } = toolbox;

    // Assemble theme path
    const themePath = fs.path("packages", "default-theme", "src");

    let files = [];

    // Get files from directories
    files = fs.find(fs.path(themePath), {
      matching: "*.vue",
    });

    let slots = [];

    // Extract slot data
    files.forEach((file) => {
      const content = fs.read(file);
      slots = slots.concat(extractSlots(content, file));
    });

    // Generate .md output
    const output = generateMarkdown(slots);

    fs.write("output.md", output);
  },
};

function extractSlots(content, file) {
  const slots = content.match(/<SwPluginSlot[^>]*>/gs);
  if (!slots || slots.length <= 0) {
    return [];
  }

  return slots.map((slot) => {
    let name = "default";
    const slotContent = slot.match(/<SwPluginSlot(.*)>/s)[1];
    const attrs = slotContent.match(/\s?:?([\w|_|-]+)="([\w|_|-]+|\{.*\})"/g);

    if (!attrs || attrs.length <= 0) {
      return {
        isDefault: true,
        name: "default",
        isScopedSlot: false,
        variables: [],
      };
    }

    const slotVariables = [];
    attrs.forEach((keyVal) => {
      const [, attr, val] = keyVal.match(/\s?:?(.*)="(.*)"/);
      if (attr === "name") {
        name = val;
        return;
      }

      if (attr === "v-bind") {
        const bindings = val.substr(1, val.length - 2).split(/,\s?/);
        slotVariables.push(...bindings);
        return;
      }

      slotVariables.push(attr);
    });

    return {
      isDefault: name === "default",
      name,
      isScopedSlot: slotVariables.length > 0,
      variables: slotVariables,
      file,
      markup: slot,
    };
  });
}

function generateMarkdown(slots) {
  let output = "";

  slots.forEach((slot) => {
    let flag = slot.isScopedSlot ? `<Badge text="scoped"/>` : "";

    output =
      output +
      `
### ${slot.name} ${flag}

` +
      "**File:** `" +
      slot.file +
      "`\n" +
      // "```vue\n" + slot.markup + "\n```\n\n" +
      // ":::details Use in Plugin\n```json" +
      // `
      // {
      //   "slots": [
      //     {
      //       "name": "` + slot.name+ `",
      //       "file": "component.vue"
      //     },
      // }
      // ` +
      // "```" +
      // "\n:::" +
      "\n\n---\n";
  });

  return output;
}
