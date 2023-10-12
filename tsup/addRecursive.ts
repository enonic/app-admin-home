import { globSync } from 'glob';


export function addRecursive(path: string, entry: string[]) {
	globSync(`${path}/**/*.ts`).forEach(f => entry.push(f));
}
