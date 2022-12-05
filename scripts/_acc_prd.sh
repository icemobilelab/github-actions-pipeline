#!/usr/bin/env bash

set -e;

# shellcheck source=scripts/_util.sh
source "$(dirname "$0")/_util.sh"

declare -r gha_sa='github-actions-sa'
declare -r base_rb_name='github-actions'
declare env=
declare -i print=0
declare -i recreate=0
declare -i delete=0
declare -i recreate_sa=0
declare -i delete_sa=0

declare -r -a edit_namespaces=(
    # Add new namespaces here
    coop-vn
    iga-ca
    loyalty
    oxxo-mx
    safeway-ca
)

_danger() {
    cat <<"EOWARN"
$'\033'[1;33m###################
# DANGER! DANGER! #
###################$'\033'[0m
Deleting the current ServiceAccount will invalidate the existing auth
token.

If you are recreating the ServieAccount, remember to update the corresponding
GHA secret.

Before proceeding, make sure you know what you're doing. You've been warned
EOWARN
    _confirm 'Are you sure you want to delete the existing ServiceAccount?'
}

_verify_current_login() {
    local cluster=
    # shellcheck disable=SC2310
    # shellcheck disable=SC2310
    if ! cluster="$(set -e; _get_current_cluster)"; then
        _error 'Please log into a cluster'
    fi

    if ! (echo "$cluster" | grep "${env}"); then
        _error "$cluster doesn't look like a $env cluster"
    fi

    echo "Currently logged into $cluster"
    _confirm "Are you certain this is the right cluster?"
}

_setup_sa() {
    local ns="$1"
    # shellcheck disable=SC2310
    if _check_serviceaccount "$gha_sa" "$ns"; then
        if [ "$delete_sa" -eq 1 ]; then
            _danger
            _delete_serviceaccount "$gha_sa" "$ns"
        elif [ "$recreate_sa" -eq 1 ]; then
            _danger
            _delete_serviceaccount "$gha_sa" "$ns"
            _create_serviceaccount "$gha_sa" "$ns"
            _print_sa_token "$gha_sa" "$ns"
        else
            _ignore_existing 'ServiceAccount' "$gha_sa"
        fi
    elif [ "$delete_sa" -eq 1 ]; then
        _ignore_missing 'ServiceAccount' "$gha_sa"
    else
        _create_serviceaccount "$gha_sa" "$ns"
        _print_sa_token "$gha_sa" "$ns"
    fi
}

_setup_binding() {
    local type="$1"
    local name="$2"
    local role="$3"
    local sa="$4"
    local ns="${5:-}"

    # shellcheck disable=SC2310
    if _check_binding "$type" "$name" "$ns"; then
        if [ "$delete" -eq 1 ]; then
            _delete_binding "$type" "$name" "$ns"
        elif [ "$recreate" -eq 1 ]; then
            _delete_binding "$type" "$name" "$ns"
            _create_binding "$type" "$name" "$role" "$sa" "$ns"
        else
            _ignore_existing "$type" "$name" "$ns"
        fi
    elif [ "$delete" -eq 1 ]; then
        _ignore_missing "$type" "$name" "$ns"
    else
        _create_binding "$type" "$name" "$role" "$sa" "$ns"
    fi
}

_setup_edit_rolebindings() {
    local sa_ns="$1"

    for ns in "${edit_namespaces[@]}"; do
        local role_ns="${ns}-${env}"
        # shellcheck disable=SC2310
        if _check ns "$role_ns"; then
            local rb="${base_rb_name}-edit-${role_ns}"
            _setup_binding 'rolebinding' "$rb" 'edit' "${sa_ns}:${gha_sa}" "$role_ns"
        fi
    done
}

_run() {
    local ns="loyalty-${env}"

    _verify_current_login
    if [ "$print" -eq 1 ]; then
        _print_sa_token "$gha_sa" "$ns"
        exit;
    fi
    _setup_sa "$ns"
    _setup_edit_rolebindings "$ns"
}

while getopts ':pRDQXe:' arg "$@"; do
	case "${arg}" in
        p) print=1 ;;
        R) recreate=1 ;;
        D) delete=1 ;;
        X) recreate_sa=1 ;;
        Q) delete_sa=1 ;;
        e) env="$OPTARG" ;;
        *) _error "Unrecognized option" "${@:$OPTIND-1:1}" ;;
	esac
done

_run "$@"
