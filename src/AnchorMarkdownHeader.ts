// source from https://github.com/thlorenz/anchor-markdown-header , and modify js to ts.

import emojiRegex = require('emoji-regex');

export class AnchorMarkdownHeader {

    // https://github.com/joyent/node/blob/192192a09e2d2e0d6bdd0934f602d2dbbf10ed06/tools/doc/html.js#L172-L183
    public static getNodejsId(text: string, repetition: number): string {
        text = text.replace(/[^a-z0-9]+/g, '_');
        text = text.replace(/^_+|_+$/, '');
        text = text.replace(/^([^a-z])/, '_$1');

        // If no repetition, or if the repetition is 0 then ignore. Otherwise append '_' and the number.
        // An example may be found here: http://nodejs.org/api/domain.html#domain_example_1
        if (repetition) {
            text += '_' + repetition;
        }

        return text;
    }

    public static getBasicGithubId(text: string): string {
        return text.replace(/ /g, '-')
            // escape codes
            .replace(/%([abcdef]|\d){2,2}/ig, '')
            // single chars that are removed
            .replace(/[\/?!:\[\]`.,()*"';{}+=<>~\$|#@&–—]/g, '')
            // CJK punctuations that are removed
            .replace(/[。？！，、；：“”【】（）〔〕［］﹃﹄“ ”‘’﹁﹂—…－～《》〈〉「」]/g, '');
    }

    public static getGithubId(text: string, repetition: number): string {
        text = AnchorMarkdownHeader.getBasicGithubId(text);

        // If no repetition, or if the repetition is 0 then ignore. Otherwise append '-' and the number.
        if (repetition) {
            text += '-' + repetition;
        }

        // Strip emojis
        text = text.replace(emojiRegex(), '');
        return text;
    }

    public static getBitbucketId(text: string, repetition: number): string {
        text = 'markdown-header-' + AnchorMarkdownHeader.getBasicGithubId(text);

        // BitBucket condenses consecutive hyphens (GitHub doesn't)
        text = text.replace(/--+/g, '-');

        // If no repetition, or if the repetition is 0 then ignore. Otherwise append '_' and the number.
        // https://groups.google.com/d/msg/bitbucket-users/XnEWbbzs5wU/Fat0UdIecZkJ
        if (repetition) {
            text += '_' + repetition;
        }

        return text;
    }

    public static basicGhostId(text: string): string {
        return text.replace(/ /g, '-')
            // escape codes are not removed
            // single chars that are removed
            .replace(/[\/?:\[\]`.,()*"';{}\-+=<>!@#%^&\\\|]/g, '')
            // $ replaced with d
            .replace(/\$/g, 'd')
            // ~ replaced with t
            .replace(/~/g, 't');
    }

    public static getGhostId(text: string, repetition: number): string {
        text = AnchorMarkdownHeader.basicGhostId(text);

        // Repetitions not supported
        return text;
    }

    // see: https://github.com/gitlabhq/gitlabhq/blob/master/doc/user/markdown.md#header-ids-and-links
    public static getGitlabId(text: string, repetition: number): string {
        text = text
            .replace(/<(.*)>(.*)<\/\1>/g, "$2") // html tags
            .replace(/!\[.*\]\(.*\)/g, '')      // image tags
            .replace(/\[(.*)\]\(.*\)/, "$1")    // url
            .replace(/\s+/g, '-')              // All spaces are converted to hyphens
            .replace(/[\/?!:\[\]`.,()*"';{}+=<>~\$|#@]/g, '') // All non-word text (e.g., punctuation, HTML) is removed
            .replace(/[。？！，、；：“”【】（）〔〕［］﹃﹄“ ”‘’﹁﹂—…－～《》〈〉「」]/g, '') // remove CJK punctuations
            .replace(/[-]+/g, '-')              // duplicated hyphen
            .replace(/^-/, '')                  // ltrim hyphen
            .replace(/-$/, '');                 // rtrim hyphen
        // If no repetition, or if the repetition is 0 then ignore. Otherwise append '-' and the number.
        if (repetition) {
            text += '-' + repetition;
        }
        return text;
    }

    /**
     * Generates an anchor for the given header and mode.
     *
     * @name anchorMarkdownHeader
     * @function
     * @param header      {String} The header to be anchored.
     * @param mode        {String} The anchor mode (github.com|nodejs.org|bitbucket.org|ghost.org|gitlab.com).
     * @param repetition  {Number} The nth occurrence of this header text, starting with 0. Not required for the 0th instance.
     * @param moduleName  {String} The name of the module of the given header (required only for 'nodejs.org' mode).
     * @return            {String} The header anchor that is compatible with the given mode.
     */
    public static anchorMarkdownHeader(header: string, mode: string, repetition: number, moduleName: string): string {
        mode = mode || 'github.com';
        var replace;
        var customEncodeURI = encodeURI;

        switch (mode) {
            case 'github.com':
                replace = AnchorMarkdownHeader.getGithubId;
                customEncodeURI = function (uri) {
                    var newURI = encodeURI(uri);

                    // encodeURI replaces the zero width joiner character
                    // (used to generate emoji sequences, e.g.Female Construction Worker 👷🏼‍♀️)
                    // github doesn't URL encode them, so we replace them after url encoding to preserve the zwj character.
                    return newURI.replace(/%E2%80%8D/g, '\u200D');
                };
                break;
            case 'bitbucket.org':
                replace = AnchorMarkdownHeader.getBitbucketId;
                break;
            case 'gitlab.com':
                replace = AnchorMarkdownHeader.getGitlabId;
                break;
            case 'nodejs.org':
                if (!moduleName) { throw new Error('Need module name to generate proper anchor for ' + mode); }
                replace = function (hd: string, repetition: number) {
                    return AnchorMarkdownHeader.getNodejsId(moduleName + '.' + hd, repetition);
                };
                break;
            case 'ghost.org':
                replace = AnchorMarkdownHeader.getGhostId;
                break;
            default:
                throw new Error('Unknown mode: ' + mode);
        }

        function asciiOnlyToLowerCase(input: string): string {
            var result = '';
            for (var i = 0; i < input.length; ++i) {
                if (input[i] >= 'A' && input[i] <= 'Z') {
                    result += input[i].toLowerCase();
                } else {
                    result += input[i];
                }
            }
            return result;
        }

        var href = replace(asciiOnlyToLowerCase(header.trim()), repetition);
        href = customEncodeURI(href);
        href = href.toLowerCase().replace(/\s/gi, "-").replace(/%/gi, "");
        return href;
    };
};