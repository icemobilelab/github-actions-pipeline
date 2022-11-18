import * as core from '@actions/core';
import { getTestingNamespace } from '../../common/util/project-info.mjs';

const OUTPUT_KEY = 'testing-namespace';
core.setOutput(OUTPUT_KEY, getTestingNamespace());
