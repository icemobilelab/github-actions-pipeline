#!/bin/bash
#!/usr/bin/env bash

set -eu;

# shellcheck disable=SC2155
declare -r CWD="$(dirname "$0")"
declare env=
declare -i print=0
declare -i recreate=0
declare -i delete=0
declare -i recreate_sa=0
declare -i delete_sa=0

# shellcheck source=scripts/_util.sh
source "${CWD}/_util.sh"

usage() {
    cat <<EOUSAGE
Creates everything necessary for proper GitHub Actions operations in the cluster
e.g. ServiceAccount, (Cluster)RoleBindings. EXPECTS THAT YOU ARE LOGGED INTO THE
PROPER CLUSTER.

Usage: "$0" [-R | -D] [-X | -Q] [-p] [-h] -e env

Options:
    -e env  Environment in which to perform the operations. Possible
            values: TST, ACC, PRD (case-insensitive)
    -R      Recreates role bindings even if they already exist
            (conflicts with -D)
    -D      Deletes all existing role bindings (conflicts with -R)
    -p      Prints the GHA ServiceAccount token and exits. Token is always
            printed if the GHA SA is (re)created as a result of that run.
    -h      Show this message

DANGER ZONE! TREAD CAREFULLY!: These options delete the GHA ServiceAccount.
This will result in a new set of tokens being generated for the SA, which you
will then have to update on the corresponding GHA Secrets.

    -Q      Deletes the GHA ServiceAccount, if it exists (conflicts with -X)
    -X      recreates recreating the GHA ServiceAccount even if it already exists
            (conflicts with -Q)

EOUSAGE
}

declare -a _args=()
while getopts ':hpRDQXe:' arg "$@"; do
    if [ "$arg" != "h" ]; then
        if [ -n "${OPTARG:-}" ]; then
            _args+=("-$arg" "$OPTARG")
        else
            _args+=("-$arg")
        fi
    fi

	case "${arg}" in
        e) env="$(tr "[:upper:]" "[:lower:]" <<<"$OPTARG")" ;;
        p) true ;;
        R) recreate=1 ;;
        D) delete=1 ;;
        Q) recreate_sa=1 ;;
        X) delete_sa=1 ;;
		h) usage; exit 0 ;;
		*) usage; _error "Unrecognized option" "${@:$OPTIND-1:1}" ;;
	esac
done

if [ -z "$env" ]; then
    _error "You must specify a value for '-e' "
fi

if [ "$delete" -eq 1 ] && [ "$recreate" -eq 1 ]; then
    usage
    _error "Options '-f' and '-D' are mutually exclusive"
fi

if [ "$delete_sa" -eq 1 ] && [ "$recreate_sa" -eq 1 ]; then
    usage
    _error "Options '-X' and '-Q' are mutually exclusive"
fi

_debug Calling with "${_args[@]}"
if [ "$env" == "tst" ]; then
    /usr/bin/env bash "${CWD}/_tst.sh" "${_args[@]}"
elif [ "$env" == "acc" ] || [ "$env" == "prd" ]; then
    /usr/bin/env bash "${CWD}/_acc_prd.sh" "${_args[@]}"
else
    _error "Unkown env '$env'"
fi
